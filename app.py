from flask import Flask, render_template, request, redirect, url_for, jsonify
import mysql.connector

#

app = Flask(__name__)

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="info.usuarios"
    )

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email_input = request.form["email"]
        senha_input = request.form["senha"]

        try:
            db = get_db_connection()
            cursor = db.cursor(dictionary=True)

            query = "SELECT * FROM usuarios WHERE email = %s AND senha = %s"
            cursor.execute(query, (email_input, senha_input))
            usuario_encontrado = cursor.fetchone()

            cursor.close()
            db.close()

            if usuario_encontrado:
                if usuario_encontrado['cargo'] == 'leitor':
                    return redirect(url_for("painel_adm_leitor"))
                elif usuario_encontrado['cargo'] == 'editor':
                    return redirect(url_for("painel_adm_editor"))
                elif usuario_encontrado['cargo'] == 'administrador':
                    return redirect(url_for("painel_adm_administrador"))
                else:
                    return "<script>alert('Cargo não encontrado, consulte seu supervisor!'); window.location.href='/login';</script>"
            else:
                return "<script>alert('E-mail ou senha incorretos!'); window.location.href='/login';</script>"

        except mysql.connector.Error as err:
            return f"Erro no banco de dados: {err}"

    return render_template("login.html")

@app.route("/painel_adm_leitor")
def painel_adm_leitor():

    try:

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

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

        return f"Erro ao buscar usuarios: {err}"

@app.route("/painel_adm_editor")
def painel_adm_editor():

    try:

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

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

        return f"Erro ao buscar usuarios: {err}"

@app.route("/painel_adm_administrador")
def painel_adm_administrador():

    try:

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

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

        return f"Erro ao buscar usuarios: {err}"

@app.route("/alterar-cargo", methods=["POST"])
def alterar_cargo():

    dados = request.get_json()

    id_usuario = dados.get("id_usuario")
    novo_cargo = dados.get("cargo")


    cargos_permitidos = [
        "leitor",
        "editor",
        "administrador"
    ]


    # Verifica se o cargo é válido

    if novo_cargo not in cargos_permitidos:

        return jsonify({
            "status": "erro",
            "mensagem": "Cargo inválido."
        }), 400


    # Verifica se recebeu o ID

    if not id_usuario:

        return jsonify({
            "status": "erro",
            "mensagem": "Usuário não informado."
        }), 400


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
            (novo_cargo, id_usuario)
        )


        db.commit()


        if cursor.rowcount == 0:

            cursor.close()
            db.close()

            return jsonify({
                "status": "erro",
                "mensagem": "Usuário não encontrado."
            }), 404


        cursor.close()
        db.close()


        return jsonify({

            "status": "sucesso",

            "mensagem": "Cargo alterado com sucesso!"

        }), 200


    except mysql.connector.Error as err:

        return jsonify({

            "status": "erro",

            "mensagem": f"Erro no banco de dados: {err}"

        }), 500

@app.route('/receber-dados', methods=['POST'])
def receber_dados():
    dados = request.get_json()

    nome = dados.get('nome')
    email = dados.get('email')
    senha = dados.get('senha')
    cargo = dados.get('cargo')

    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        query = "SELECT * FROM usuarios WHERE email = %s"
        cursor.execute(query, (email,))
        usuario_encontrado = cursor.fetchone()

        if usuario_encontrado:
            return jsonify({
                "status": "sucesso", 
                "mensagem": f"Olá {nome}, Não foi possivel fazer esse cadastro por ja existir esse email"
            }), 200

            
        else:
            query = "INSERT INTO usuarios (nome_usuario, email, senha, cargo) VALUES (%s, %s, %s, %s)"
            cursor.execute(query, (nome, email, senha, cargo))
            
            db.commit()
            cursor.close()
            db.close()

            return jsonify({
                            "status": "sucesso", 
                            "mensagem": f"Olá {nome}, seus dados foram recebidos e salvos pelo Python!"
            }), 200
           
    except Exception as e:
        return jsonify({
            "status": "erro",
            "mensagem": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)