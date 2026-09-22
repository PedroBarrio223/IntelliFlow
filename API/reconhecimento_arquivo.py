import os
import shutil
from datetime import datetime
import uuid
import re
import time
from enum import Enum
from google import genai
from google.genai import types
from google.genai.errors import APIError
from PIL import Image
from conexao import conectar
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

# Permite requisições de qualquer origem em todas as rotas
CORS(app, resources={r"/*": {"origins": "*"}})

# Conexão com o banco de dados e busca da chave
try:
    db = conectar()
    cursor = db.cursor()
    cursor.execute("SELECT chave FROM chavesapi WHERE id = 1")
    resultado = cursor.fetchone()
    cursor.close()

    if resultado:
        API_KEY = resultado[0]
    else:
        raise ValueError("Nenhuma chave API encontrada no banco de dados para o ID = 1.")
except Exception as e:
    print(f"Erro ao conectar ao banco ou recuperar a chave API: {e}")
    raise e

# 1. Configuração do cliente Gemini
client = genai.Client(api_key=API_KEY)

# Função auxiliar para tratar erros 503 e flutuações da API com Retry Automático
def executar_com_retry(funcao, max_tentativas=3, tempo_inicial=2):
    """
    Executa uma função da API do Gemini. Em caso de erro 503 ou indisponibilidade,
    espera e tenta novamente com backoff exponencial.
    """
    for tentativa in range(1, max_tentativas + 1):
        try:
            return funcao()
        except APIError as e:
            # Captura erros de API (como 503, 500, 429)
            if (e.code in [503, 500, 429] or "UNAVAILABLE" in str(e)) and tentativa < max_tentativas:
                tempo_espera = tempo_inicial * (2 ** (tentativa - 1))
                print(f"⚠️ Erro na API do Gemini ({e.code}). Tentativa {tentativa}/{max_tentativas}. Reagendando em {tempo_espera}s...")
                time.sleep(tempo_espera)
            else:
                raise e
        except Exception as e:
            if ("503" in str(e) or "UNAVAILABLE" in str(e).upper()) and tentativa < max_tentativas:
                tempo_espera = tempo_inicial * (2 ** (tentativa - 1))
                print(f"⚠️ Erro de conexão com a API. Tentativa {tentativa}/{max_tentativas}. Reagendando em {tempo_espera}s...")
                time.sleep(tempo_espera)
            else:
                raise e

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

def gerar_nome_unico(caminho_original, tipo_doc, nome_customizado=""):
    extensao = os.path.splitext(caminho_original)[1].lower()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    if nome_customizado:
        nome_limpo = re.sub(r'[^a-zA-Z0-9_-]', '_', nome_customizado).strip('_')
        novo_nome = f"{nome_limpo}_{tipo_doc}_{timestamp}{extensao}"
    else:
        hash_unico = uuid.uuid4().hex[:8]
        novo_nome = f"{tipo_doc}_{timestamp}_{hash_unico}{extensao}"
        
    return novo_nome

def salvar_arquivo_na_pasta_do_tipo(caminho_origem, tipo_doc, nome_customizado=""):
    pasta_destino = os.path.join(PASTA_DESTINO_BASE, tipo_doc)
    os.makedirs(pasta_destino, exist_ok=True)
    
    novo_nome = gerar_nome_unico(caminho_origem, tipo_doc, nome_customizado)
    caminho_destino = os.path.join(pasta_destino, novo_nome)
    
    shutil.copy2(caminho_origem, caminho_destino)
    print(f"Arquivo salvo como: {novo_nome}")
    return caminho_destino

@app.route('/upload', methods=['POST'])
def processar_upload():
    if 'imagem' not in request.files:
        return jsonify({'erro': 'Nenhum arquivo enviado'}), 400
    
    arquivo_recebido = request.files['imagem']
    nome_arquivo_usuario = request.form.get('nome_arquivo', '').strip()
    
    if arquivo_recebido.filename == '':
        return jsonify({'erro': 'Nenhum arquivo selecionado'}), 400

    caminho_temporario = os.path.join('temp_uploads', arquivo_recebido.filename)
    os.makedirs('temp_uploads', exist_ok=True)
    arquivo_recebido.save(caminho_temporario)

    try:
        exemplos_contexto = carregar_exemplos_banco(PASTA_MODELOS, EXEMPLOS_MODELO)

        extensao = os.path.splitext(caminho_temporario)[1].lower()
        if extensao == ".pdf":
            # Upload com suporte a Retry
            documento_analise = executar_com_retry(
                lambda: client.files.upload(file=caminho_temporario)
            )
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

        # Chamada com suporte a Retry
        response_tipo = executar_com_retry(
            lambda: client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents_classificacao,
                config=types.GenerateContentConfig(
                    system_instruction=prompt_sistema,
                    response_mime_type="text/x.enum",
                    response_schema=TipoDocumento,
                    temperature=0.0
                )
            )
        )

        tipo_identificado = response_tipo.text.strip()

        # 2. Salva o arquivo utilizando o nome definido pelo usuário
        caminho_salvo = salvar_arquivo_na_pasta_do_tipo(caminho_temporario, tipo_identificado, nome_arquivo_usuario)

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

        # Chamada com suporte a Retry
        response_numero = executar_com_retry(
            lambda: client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[documento_analise, prompt_extracao]
            )
        )

        titular = response_numero.text.strip()

        # 4. Inserir no Banco de Dados
        cursor = db.cursor()
        sql = "INSERT INTO documentos (tipo, caminho, titular, nome_arquivo) VALUES (%s, %s, %s, %s)"
        dados = (tipo_identificado, caminho_salvo, titular, nome_arquivo_usuario)

        cursor.execute(sql, dados)
        db.commit()
        cursor.close()

        return jsonify({
            'sucesso': True,
            'tipo': tipo_identificado,
            'titular': titular,
            'caminho': caminho_salvo,
            'nome_arquivo': nome_arquivo_usuario
        }), 200

    except Exception as e:
        print(f"Erro ao processar o arquivo: {e}")
        return jsonify({'erro': str(e)}), 500

    finally:
        # Garante a remoção do arquivo temporário mesmo em caso de erro
        if os.path.exists(caminho_temporario):
            try:
                os.remove(caminho_temporario)
            except Exception:
                pass

if __name__ == '__main__':
    app.run(debug=True, port=5001)