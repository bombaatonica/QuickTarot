import subprocess
import sys
import os

def test_local():
    try:
        # Instalar dependências
        print("Instalando dependências...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])

        # Iniciar MongoDB (se não estiver rodando)
        print("Verificando MongoDB...")
        try:
            import pymongo
            client = pymongo.MongoClient("mongodb://localhost:27017/")
            client.server_info()  # Força conexão para verificar se MongoDB está rodando
            print("MongoDB conectado com sucesso!")
        except Exception as e:
            print(f"Erro ao conectar ao MongoDB: {e}")
            print("Certifique-se de que o MongoDB está rodando localmente.")

        # Iniciar aplicação
        print("\nIniciando aplicação...")
        print("Acesse http://localhost:8000 para testar a API")
        print("Pressione Ctrl+C para parar a aplicação")
        subprocess.check_call([sys.executable, "run.py"])

    except subprocess.CalledProcessError as e:
        print(f"Erro ao executar aplicação: {e}")

if __name__ == "__main__":
    test_local()