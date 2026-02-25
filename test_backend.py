
import subprocess
import sys
import os
import time

def test_backend():
    try:
        print("=== TESTE DO BACKEND ===")
        print("1. Instalando dependências...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "backend/requirements.txt"])

        print("\n2. Iniciando servidor backend...")
        backend_process = subprocess.Popen(
            [sys.executable, "backend/run.py"],
            cwd="backend",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        # Aguardar um pouco para o backend iniciar
        time.sleep(3)

        print("\n3. Verificando se backend está rodando...")
        try:
            import requests
            response = requests.get("http://localhost:8000/health")
            if response.status_code == 200:
                print("✅ Backend está rodando!")
            else:
                print(f"❌ Backend retornou status {response.status_code}")
        except Exception as e:
            print(f"❌ Erro ao testar backend: {e}")

        print("\n4. Parando servidor backend...")
        backend_process.terminate()
        backend_process.wait()
        print("✅ Backend parado com sucesso!")

    except subprocess.CalledProcessError as e:
        print(f"Erro ao executar aplicação: {e}")

if __name__ == "__main__":
    test_backend()