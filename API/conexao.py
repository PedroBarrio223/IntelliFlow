import mysql.connector
from mysql.connector import Error

#pip install mysql-connector-python

def conectar():
    try:
        conexao = mysql.connector.connect(
            host = 'localhost',
            user = 'root',
            password = '',
            database = 'info.usuarios'
        )
        if conexao.is_connected():
            return conexao

    except Error as e:
        print(f"Erro ao conectar ao MySQl: {e}")
        return None