from flask import Flask, render_template, request, redirect, url_for
import mysql.connector

app = Flask(__name__)

# Conexão com o banco MySQL do XAMPP
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="info.usuarios"  # Utilizando o nome do banco com ponto conforme configurado no seu XAMPP
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

            # Valida email e senha no banco de dados
            query = "SELECT * FROM usuarios WHERE email = %s AND senha = %s"
            cursor.execute(query, (email_input, senha_input))
            usuario_encontrado = cursor.fetchone()

            cursor.close()
            db.close()

            if usuario_encontrado:
                # Redireciona para a rota do painel ADM para carregar os dados da tabela
                return redirect(url_for("painel_adm"))
            else:
                return "<script>alert('E-mail ou senha incorretos!'); window.location.href='/login';</script>"

        except mysql.connector.Error as err:
            return f"Erro no banco de dados: {err}"

    return render_template("login.html")

@app.route("/painelADM")
def painel_adm():
    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        # Consulta todos os usuarios cadastrados
        query = "SELECT id_usuario, nome_usuario, email FROM usuarios"
        cursor.execute(query)
        lista_usuarios = cursor.fetchall()

        cursor.close()
        db.close()

        # Renderiza a pagina do painel passando os dados dos usuarios
        return render_template("painelADM.html", usuarios=lista_usuarios)

    except mysql.connector.Error as err:
        return f"Erro ao buscar usuarios: {err}"

if __name__ == "__main__":
    app.run(debug=True)