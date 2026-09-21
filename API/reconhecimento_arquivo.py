import os
import shutil
from datetime import datetime
import uuid
from enum import Enum
from google import genai
from google.genai import types
from PIL import Image
from conexao import conectar
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

# Permite requisições de qualquer origem em todas as rotas
CORS(app, resources={r"/*": {"origins": "*"}})

# Conexão com o banco de dados
db = conectar()

# Criar o cursor para executar a consulta
cursor = db.cursor()

# Executar o SELECT na tabela chavesapi onde id = 1
cursor.execute("SELECT chave FROM chavesapi WHERE id = 1")
resultado = cursor.fetchone()

# Fechar o cursor após a consulta
cursor.close()

# Verificar se a chave foi encontrada
if resultado:
    API_KEY = resultado[0]  # O resultado vem como uma tupla, onde a coluna 'chave' é o índice 0
else:
    raise ValueError("Nenhuma chave API encontrada no banco de dados para o ID = 1.")

# 1. Configuração do cliente Gemini
client = genai.Client(api_key=API_KEY)

# 2. Definição do Enum com os tipos permitidos
class TipoDocumento(str, Enum):
    RG = "RG"
    CNH = "CNH"
    CPF = "CPF"
    PROCURACAO = "Procuracao"
    CERTIDAO_NASCIMENTO = "Certidao_Nascimento"
    COMPROVANTE_RESIDENCIA = "Comprovante_Residencia"
    CONTRATO_SOCIAL = "Contrato_Social"
    PASSAPORTE = "Passaporte"
    DESCONHECIDO = "Desconhecido"

PASTA_MODELOS = "banco_modelos"
PASTA_DESTINO_BASE = "documentos_processados"

EXEMPLOS_MODELO = {
    "modelorg.jpg": TipoDocumento.RG,
    "modelocnh.jpg": TipoDocumento.CNH,
    "modelocpf.jpg": TipoDocumento.CPF,
}

def carregar_exemplos_banco(pasta, mapeamento):
    conteudo_exemplos = []
    for nome_arquivo, tipo in mapeamento.items():
        caminho_completo = os.path.join(pasta, nome_arquivo)
        if os.path.exists(caminho_completo):
            img = Image.open(caminho_completo)
            conteudo_exemplos.append(img)
            conteudo_exemplos.append(f"Este é um exemplo de modelo do tipo: {tipo.value}")
    return conteudo_exemplos

def gerar_nome_unico(caminho_original, tipo_doc):
    extensao = os.path.splitext(caminho_original)[1].lower()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    hash_unico = uuid.uuid4().hex[:8]
    novo_nome = f"{tipo_doc}_{timestamp}_{hash_unico}{extensao}"
    return novo_nome

def salvar_arquivo_na_pasta_do_tipo(caminho_origem, tipo_doc):
    pasta_destino = os.path.join(PASTA_DESTINO_BASE, tipo_doc)
    os.makedirs(pasta_destino, exist_ok=True)
    
    novo_nome = gerar_nome_unico(caminho_origem, tipo_doc)
    caminho_destino = os.path.join(pasta_destino, novo_nome)
    
    shutil.copy2(caminho_origem, caminho_destino)
    print(f"Arquivo salvo como: {novo_nome}")
    return caminho_destino

# --- ROTA DO FLASK PARA RECEBER O UPLOAD ---
@app.route('/upload', methods=['POST'])
def processar_upload():
    if 'imagem' not in request.files:
        return jsonify({'erro': 'Nenhum arquivo enviado'}), 400
    
    arquivo_recebido = request.files['imagem']
    
    if arquivo_recebido.filename == '':
        return jsonify({'erro': 'Nome do arquivo vazio'}), 400

    # Salvamos temporariamente no servidor para o Gemini/Shutil conseguirem ler o caminho físico
    os.makedirs('temp_uploads', exist_ok=True)
    caminho_temporario = os.path.join('temp_uploads', arquivo_recebido.filename)
    arquivo_recebido.save(caminho_temporario)

    try:
        # Carrega os exemplos do banco de modelos
        exemplos_contexto = carregar_exemplos_banco(PASTA_MODELOS, EXEMPLOS_MODELO)

        extensao = os.path.splitext(caminho_temporario)[1].lower()
        if extensao == ".pdf":
            documento_analise = client.files.upload(file=caminho_temporario)
        else:
            documento_analise = Image.open(caminho_temporario)

        # 1. Classificação do Documento
        contents_classificacao = [
            *exemplos_contexto,
            documento_analise,
            "Compare este último documento enviado com os modelos de exemplo acima e retorne apenas o tipo dele."
        ]

        prompt_sistema = (
            "Você é um classificador visual de documentos. "
            "Analise a estrutura do último documento enviado comparando-o com os modelos de referência fornecidos. "
            "Retorne APENAS o nome do tipo do documento, sem explicações, saudações ou pontuação."
        )

        response_tipo = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents_classificacao,
            config=types.GenerateContentConfig(
                system_instruction=prompt_sistema,
                response_mime_type="text/x.enum",
                response_schema=TipoDocumento,
                temperature=0.0
            )
        )

        tipo_identificado = response_tipo.text.strip()
        print(f"\n--- TIPO IDENTIFICADO: {tipo_identificado} ---")

        # 2. Salvar o arquivo com nome único na pasta definitiva do seu tipo
        caminho_salvo = salvar_arquivo_na_pasta_do_tipo(caminho_temporario, tipo_identificado)

        # 3. Extração do Número (RG ou CPF)
        if "RG" in tipo_identificado.upper():
            alvo_documento = "RG (Registro Geral)"
        else:
            alvo_documento = "CPF"

        prompt_extracao = (
            f"Sua tarefa é localizar e extrair o número do {alvo_documento} presente neste documento.\n"
            "Regras estritas de resposta:\n"
            "1. Retorne APENAS os dígitos do número do documento (apenas números, sem pontos, hífen, letras ou espaços).\n"
            "2. Não inclua NENHUMA palavra, rótulo, saudação ou texto explicativo.\n"
            f"3. Se o {alvo_documento} não for encontrado ou estiver totalmente ilegível, responda exatamente: Não encontrado"
        )

        response_numero = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[documento_analise, prompt_extracao]
        )

        titular = response_numero.text.strip()
        print(f"\n--- NÚMERO DO {alvo_documento} EXTRAÍDO ---")
        print(titular)

        # 4. Inserir no Banco de Dados
        cursor = db.cursor()
        sql = "INSERT INTO documentos (tipo, caminho, titular) VALUES (%s, %s, %s)"
        dados = (tipo_identificado, caminho_salvo, titular)
        cursor.execute(sql, dados)
        db.commit()
        cursor.close()

        # Remove o arquivo temporário da pasta temp_uploads
        if os.path.exists(caminho_temporario):
            os.remove(caminho_temporario)

        return jsonify({
            'sucesso': True,
            'tipo': tipo_identificado,
            'titular': titular,
            'caminho': caminho_salvo
        }), 200

    except Exception as e:
        # Garante limpeza caso dê erro
        if os.path.exists(caminho_temporario):
            os.remove(caminho_temporario)
        print(f"Ocorreu um erro: {e}")
        return jsonify({'erro': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
