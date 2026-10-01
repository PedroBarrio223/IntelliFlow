from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    jsonify,
    send_file
)

import mysql.connector
import os
import mimetypes
from flask import Flask, request, jsonify, send_file

# =========================================================
# CONFIGURAÇÃO DO FLASK
# =========================================================

app = Flask(__name__)


# =========================================================
# CAMINHO BASE DO PROJETO
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

# =========================================================
# VISUALIZAR DOCUMENTO
# =========================================================

@app.route("/documento/<int:id_documento>/visualizar")
def visualizar_documento(id_documento):
    db = None
    cursor = None

    try:
        print("\n========================================")
        print("SOLICITAÇÃO DE VISUALIZAÇÃO DE DOCUMENTO")
        print("ID:", id_documento)
        print("========================================")

        # 1. BUSCA O CAMINHO NA TABELA 'documentos' PELO ID
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        query = """
            SELECT
                id,
                caminho,
                nome_arquivo,
                tipo
            FROM documentos
            WHERE id = %s
        """

        cursor.execute(query, (id_documento,))
        documento = cursor.fetchone()

        cursor.close()
        db.close()

        # 2. VALIDAÇÃO DO REGISTRO
        if not documento:
            print("Erro: Documento não encontrado no banco de dados.")
            return jsonify({"erro": "Documento não encontrado no banco de dados."}), 404

        caminho_banco = documento.get("caminho")

        if not caminho_banco:
            print("Erro: O campo 'caminho' no banco está vazio.")
            return jsonify({"erro": "O documento não possui caminho armazenado no banco."}), 404

        # 3. CORRIGE BARRAS E MONTA O CAMINHO ABSOLUTO
        caminho_normalizado = caminho_banco.replace("\\", os.sep).replace("/", os.sep)

        if not os.path.isabs(caminho_normalizado):
            # BASE_DIR precisa estar definido no seu código (ex: BASE_DIR = os.path.dirname(os.path.abspath(__file__)))
            caminho_absoluto = os.path.join(BASE_DIR, caminho_normalizado)
        else:
            caminho_absoluto = caminho_normalizado

        caminho_absoluto = os.path.abspath(caminho_absoluto)

        print(f"Caminho vindo do Banco: {caminho_banco}")
        print(f"Caminho absoluto final: {caminho_absoluto}")

        # 4. VERIFICA SE O ARQUIVO FÍSICO EXISTE NO DISCO
        if not os.path.isfile(caminho_absoluto):
            print("ARQUIVO FÍSICO NÃO ENCONTRADO NO DISCO!")
            return jsonify({
                "erro": "Arquivo físico não encontrado na pasta do servidor.",
                "caminho_banco": caminho_banco,
                "caminho_procurado": caminho_absoluto
            }), 404

        # 5. DETECTA O TIPO MIME DO ARQUIVO
        mime_type, _ = mimetypes.guess_type(caminho_absoluto)
        if not mime_type:
            mime_type = "application/octet-stream"

        print(f"Tipo MIME detectado: {mime_type}")

        # 6. RETORNA O ARQUIVO ENCONTRADO NO CAMINHO PARA O FRONTEND
        return send_file(
            caminho_absoluto,
            mimetype=mime_type,
            as_attachment=False
        )

    except Exception as e:
        print(f"Erro no servidor ao visualizar documento: {e}")
        return jsonify({"erro": f"Erro interno no servidor: {str(e)}"}), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()


# =========================================================
# CONEXÃO COM BANCO DE DADOS
# =========================================================

def get_db_connection():

    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="info.usuarios"
    )


# =========================================================
# PÁGINA INICIAL
# =========================================================

@app.route("/")
def index():

    return render_template(
        "index.html"
    )


# =========================================================
# LOGIN
# =========================================================

@app.route(
    "/login",
    methods=["GET", "POST"]
)
def login():

    if request.method == "POST":

        email_input = request.form["email"]

        senha_input = request.form["senha"]


        try:

            db = get_db_connection()

            cursor = db.cursor(
                dictionary=True
            )


            query = """
                SELECT *
                FROM usuarios
                WHERE email = %s
                AND senha = %s
            """


            cursor.execute(
                query,
                (
                    email_input,
                    senha_input
                )
            )


            usuario_encontrado = cursor.fetchone()


            cursor.close()

            db.close()


            if usuario_encontrado:

                if usuario_encontrado["cargo"] == "leitor":

                    return redirect(
                        url_for(
                            "painel_adm_leitor"
                        )
                    )


                elif usuario_encontrado["cargo"] == "editor":

                    return redirect(
                        url_for(
                            "painel_adm_editor"
                        )
                    )


                elif usuario_encontrado["cargo"] == "administrador":

                    return redirect(
                        url_for(
                            "painel_adm_administrador"
                        )
                    )


                else:

                    return """
                    <script>
                        alert(
                            'Cargo não encontrado, consulte seu supervisor!'
                        );

                        window.location.href='/login';
                    </script>
                    """


            else:

                return """
                <script>
                    alert(
                        'E-mail ou senha incorretos!'
                    );

                    window.location.href='/login';
                </script>
                """


        except mysql.connector.Error as err:

            return f"Erro no banco de dados: {err}"


    return render_template(
        "login.html"
    )


# =========================================================
# PAINEL DO LEITOR
# =========================================================

@app.route("/painel_adm_leitor")
def painel_adm_leitor():

    try:

        db = get_db_connection()

        cursor = db.cursor(
            dictionary=True
        )


        query = """
            SELECT
                id_usuario,
                nome_usuario,
                email,
                cargo
            FROM usuarios
        """


        cursor.execute(query)

        lista_usuarios = cursor.fetchall()


        cursor.close()

        db.close()


        return render_template(
            "painelADM_leitor.html",
            usuarios=lista_usuarios
        )


    except mysql.connector.Error as err:

        return (
            f"Erro ao buscar usuarios: {err}"
        )


# =========================================================
# PAINEL DO EDITOR
# =========================================================

@app.route("/painel_adm_editor")
def painel_adm_editor():

    try:

        db = get_db_connection()

        cursor = db.cursor(
            dictionary=True
        )


        query = """
            SELECT
                id_usuario,
                nome_usuario,
                email,
                cargo
            FROM usuarios
        """


        cursor.execute(query)

        lista_usuarios = cursor.fetchall()


        cursor.close()

        db.close()


        return render_template(
            "painelADM_editor.html",
            usuarios=lista_usuarios
        )


    except mysql.connector.Error as err:

        return (
            f"Erro ao buscar usuarios: {err}"
        )


# =========================================================
# PAINEL DO ADMINISTRADOR
# =========================================================

@app.route("/painel_adm_administrador")
def painel_adm_administrador():

    try:

        db = get_db_connection()

        cursor = db.cursor(
            dictionary=True
        )


        query = """
            SELECT
                id_usuario,
                nome_usuario,
                email,
                cargo
            FROM usuarios
        """


        cursor.execute(query)

        lista_usuarios = cursor.fetchall()


        cursor.close()

        db.close()


        return render_template(
            "painelADM_administrador.html",
            usuarios=lista_usuarios
        )


    except mysql.connector.Error as err:

        return (
            f"Erro ao buscar usuarios: {err}"
        )


# =========================================================
# LISTAR / FILTRAR DOCUMENTOS
# =========================================================

@app.route(
    "/documentos",
    methods=["GET"]
)
def listar_documentos():

    termo = request.args.get(
        "termo",
        ""
    ).strip()


    tipo_busca = request.args.get(
        "tipo",
        "nome_arquivo"
    ).strip()


    db = None

    cursor = None


    try:

        db = get_db_connection()

        cursor = db.cursor(
            dictionary=True
        )


        # -------------------------------------------------
        # SQL BASE
        # -------------------------------------------------

        sql = """
            SELECT
                id,
                tipo,
                caminho,
                titular,
                nome_arquivo
            FROM documentos
        """


        filtros = []

        parametros = []


        # -------------------------------------------------
        # FILTROS
        # -------------------------------------------------

        if termo:

            parametro_like = (
                f"%{termo}%"
            )


            if tipo_busca == "cpf":

                filtros.append(
                    "tipo = 'CPF' AND titular LIKE %s"
                )

                parametros.append(
                    parametro_like
                )


            elif tipo_busca == "rg":

                filtros.append(
                    "tipo = 'RG' AND titular LIKE %s"
                )

                parametros.append(
                    parametro_like
                )


            elif tipo_busca == "nome_arquivo":

                filtros.append(
                    "nome_arquivo LIKE %s"
                )

                parametros.append(
                    parametro_like
                )


            elif tipo_busca == "tipo_documento":

                filtros.append(
                    "tipo LIKE %s"
                )

                parametros.append(
                    parametro_like
                )


        # -------------------------------------------------
        # ADICIONA WHERE
        # -------------------------------------------------

        if filtros:

            sql += (
                " WHERE "
                + " AND ".join(filtros)
            )


        # -------------------------------------------------
        # ORDENAÇÃO
        # -------------------------------------------------

        sql += """
            ORDER BY id DESC
        """


        # -------------------------------------------------
        # EXECUTA
        # -------------------------------------------------

        cursor.execute(
            sql,
            tuple(parametros)
        )


        resultados = cursor.fetchall()


        return jsonify(
            resultados
        ), 200


    except Exception as e:

        print(
            f"Erro ao buscar documentos: {e}"
        )


        return jsonify({
            "erro": str(e)
        }), 500


    finally:

        if cursor:

            cursor.close()


        if db:

            db.close()


# =========================================================
# ESTATÍSTICAS DOS DOCUMENTOS
# =========================================================

@app.route(
    "/estatisticas-documentos",
    methods=["GET"]
)
def estatisticas_documentos():

    db = None
    cursor = None

    try:

        db = get_db_connection()

        cursor = db.cursor(
            dictionary=True
        )

        # -------------------------------------------------
        # DOCUMENTOS POR TIPO
        # -------------------------------------------------

        query = """
            SELECT
                tipo,
                COUNT(*) AS quantidade
            FROM documentos
            GROUP BY tipo
            ORDER BY quantidade DESC
        """

        cursor.execute(query)

        resultados = cursor.fetchall()

        tipos = []
        quantidades = []

        for documento in resultados:

            tipos.append(
                documento["tipo"]
            )

            quantidades.append(
                documento["quantidade"]
            )

        # -------------------------------------------------
        # TITULARES DIFERENTES
        # -------------------------------------------------

        query_titulares = """
            SELECT
                COUNT(DISTINCT titular) AS total_titulares
            FROM documentos
            WHERE titular IS NOT NULL
              AND TRIM(titular) <> ''
        """

        cursor.execute(query_titulares)

        resultado_titulares = cursor.fetchone()

        total_titulares = int(
            resultado_titulares["total_titulares"] or 0
        )

        # -------------------------------------------------
        # RETORNO
        # -------------------------------------------------

        return jsonify({

            "tipos": tipos,

            "quantidades": quantidades,

            "total_titulares": total_titulares

        }), 200

    except mysql.connector.Error as err:

        print(
            "Erro ao buscar estatísticas:",
            err
        )

        return jsonify({

            "erro":
                "Erro ao buscar estatísticas dos documentos."

        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()


# =========================================================
# ALTERAR CARGO
# =========================================================

@app.route(
    "/alterar-cargo",
    methods=["POST"]
)
def alterar_cargo():

    dados = request.get_json()


    if not dados:

        return jsonify({

            "status": "erro",

            "mensagem":
                "Dados não recebidos."

        }), 400


    id_usuario = dados.get(
        "id_usuario"
    )


    novo_cargo = dados.get(
        "cargo"
    )


    cargos_permitidos = [

        "leitor",

        "editor",

        "administrador"

    ]


    # -------------------------------------------------
    # VALIDA CARGO
    # -------------------------------------------------

    if novo_cargo not in cargos_permitidos:

        return jsonify({

            "status": "erro",

            "mensagem":
                "Cargo inválido."

        }), 400


    # -------------------------------------------------
    # VALIDA ID
    # -------------------------------------------------

    if not id_usuario:

        return jsonify({

            "status": "erro",

            "mensagem":
                "Usuário não informado."

        }), 400


    db = None

    cursor = None


    try:

        db = get_db_connection()

        cursor = db.cursor()


        query = """
            UPDATE usuarios
            SET cargo = %s
            WHERE id_usuario = %s
        """


        cursor.execute(
            query,
            (
                novo_cargo,
                id_usuario
            )
        )


        db.commit()


        if cursor.rowcount == 0:

            return jsonify({

                "status": "erro",

                "mensagem":
                    "Usuário não encontrado."

            }), 404


        return jsonify({

            "status": "sucesso",

            "mensagem":
                "Cargo alterado com sucesso!"

        }), 200


    except mysql.connector.Error as err:

        if db:

            db.rollback()


        return jsonify({

            "status": "erro",

            "mensagem":
                f"Erro no banco de dados: {err}"

        }), 500


    finally:

        if cursor:

            cursor.close()


        if db:

            db.close()


# =========================================================
# CADASTRO DE USUÁRIO
# =========================================================

@app.route(
    "/receber-dados",
    methods=["POST"]
)
def receber_dados():

    dados = request.get_json()


    if not dados:

        return jsonify({

            "status": "erro",

            "mensagem":
                "Nenhum dado recebido."

        }), 400


    nome = dados.get(
        "nome"
    )


    email = dados.get(
        "email"
    )


    senha = dados.get(
        "senha"
    )


    cargo = dados.get(
        "cargo"
    )


    db = None

    cursor = None


    try:

        db = get_db_connection()

        cursor = db.cursor(
            dictionary=True
        )


        # -------------------------------------------------
        # VERIFICA EMAIL
        # -------------------------------------------------

        query = """
            SELECT *
            FROM usuarios
            WHERE email = %s
        """


        cursor.execute(
            query,
            (email,)
        )


        usuario_encontrado = (
            cursor.fetchone()
        )


        if usuario_encontrado:

            return jsonify({

                "status": "erro",

                "mensagem":
                    f"Olá {nome}, não foi possível fazer esse cadastro porque esse email já existe."

            }), 400


        # -------------------------------------------------
        # INSERE USUÁRIO
        # -------------------------------------------------

        query = """
            INSERT INTO usuarios
            (
                nome_usuario,
                email,
                senha,
                cargo
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s
            )
        """


        cursor.execute(
            query,
            (
                nome,
                email,
                senha,
                cargo
            )
        )


        db.commit()


        return jsonify({

            "status": "sucesso",

            "mensagem":
                f"Olá {nome}, seus dados foram recebidos e salvos pelo Python!"

        }), 200


    except Exception as e:

        if db:

            db.rollback()


        return jsonify({

            "status": "erro",

            "mensagem":
                str(e)

        }), 500


    finally:

        if cursor:

            cursor.close()


        if db:

            db.close()


# =========================================================
# INICIAR SERVIDOR
# =========================================================

if __name__ == "__main__":

    app.run(
        debug=True,
        port=5000
    )
