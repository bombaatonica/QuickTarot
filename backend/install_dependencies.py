import subprocess
import sys

def install_packages():
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("Dependências instaladas com sucesso!")
    except subprocess.CalledProcessError as e:
        print(f"Erro ao instalar dependências: {e}")

if __name__ == "__main__":
    install_packages()