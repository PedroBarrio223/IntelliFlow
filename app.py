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
# VISUALIZAR DOCUMENTO
# =========================================================

@app.route(
    "/documento/<int:id_documento>/visualizar"
)
def visualizar_documento(
    id_documento
):

    db = None

    cursor = None


    try:

        print("")
        print(
            "========================================"
        )

        print(
            "SOLICITAÇÃO DE VISUALIZAÇÃO"
        )

        print(
            "ID:",
            id_documento
        )

        print(
            "========================================"
        )


        # -------------------------------------------------
        # BUSCA DOCUMENTO NO BANCO
        # -------------------------------------------------

        db = get_db_connection()

        cursor = db.cursor(
            dictionary=True
        )


        query = """
            SELECT
                id,
                caminho,
                nome_arquivo,
                tipo
            FROM documentos
            WHERE id = %s
        """


        cursor.execute(
            query,
            (id_documento,)
        )


        documento = cursor.fetchone()


        # -------------------------------------------------
        # FECHA BANCO
        # -------------------------------------------------

        cursor.close()

        cursor = None

        db.close()

        db = None


        # -------------------------------------------------
        # VERIFICA DOCUMENTO
        # -------------------------------------------------

        if not documento:

            print(
                "Documento não encontrado no banco."
            )


            return jsonify({
                "erro": "Documento não encontrado."
            }), 404


        print(
            "Documento encontrado:",
            documento
        )


        # -------------------------------------------------
        # PEGA CAMINHO
        # -------------------------------------------------

        caminho = documento.get(
            "caminho"
        )


        if not caminho:

            print(
                "O campo caminho está vazio."
            )


            return jsonify({
                "erro":
                    "O documento não possui caminho armazenado."
            }), 404


        # -------------------------------------------------
        # CORRIGE BARRAS
        # -------------------------------------------------

        caminho = caminho.replace(
            "\\",
            os.sep
        )


        # -------------------------------------------------
        # SE O CAMINHO FOR RELATIVO
        # adiciona a pasta do projeto
        # -------------------------------------------------

        if not os.path.isabs(caminho):

            caminho_absoluto = os.path.join(
                BASE_DIR,
                caminho
            )

        else:

            caminho_absoluto = caminho


        # -------------------------------------------------
        # NORMALIZA O CAMINHO
        # -------------------------------------------------

        caminho_absoluto = os.path.abspath(
            caminho_absoluto
        )


        # -------------------------------------------------
        # DEBUG
        # -------------------------------------------------

        print(
            "Caminho salvo no banco:"
        )

        print(
            documento["caminho"]
        )


        print(
            "Caminho convertido:"
        )

        print(
            caminho_absoluto
        )


        print(
            "Arquivo existe:"
        )

        print(
            os.path.isfile(
                caminho_absoluto
            )
        )


        # -------------------------------------------------
        # VERIFICA ARQUIVO FÍSICO
        # -------------------------------------------------

        if not os.path.isfile(
            caminho_absoluto
        ):

            print(
                "ARQUIVO NÃO ENCONTRADO!"
            )


            return jsonify({

                "erro":
                    "Arquivo físico não encontrado.",

                "caminho_banco":
                    documento["caminho"],

                "caminho_procurado":
                    caminho_absoluto

            }), 404


        # -------------------------------------------------
        # DESCOBRE MIME TYPE
        # -------------------------------------------------

        mime_type, _ = (
            mimetypes.guess_type(
                caminho_absoluto
            )
        )


        if not mime_type:

            mime_type = (
                "application/octet-stream"
            )


        print(
            "Tipo MIME:",
            mime_type
        )


        # -------------------------------------------------
        # ENVIA ARQUIVO
        # -------------------------------------------------

        return send_file(
            caminho_absoluto,
            mimetype=mime_type
        )


    except Exception as e:

        print("")
        print(
            "ERRO AO VISUALIZAR DOCUMENTO:"
        )

        print(e)


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


        return jsonify({

            "tipos": tipos,

            "quantidades": quantidades

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
