import subprocess
import sys
import os
import time

def test_complete():
    try:
        print("=== TESTE COMPLETO DA INTEGRAÇÃO ===")
        print("1. Verificando backend...")
        print("   Iniciando servidor backend...")
        backend_process = subprocess.Popen(
            [sys.executable, "backend/run.py"],
            cwd="backend",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        # Aguardar um pouco para o backend iniciar
        time.sleep(3)

        print("\n2. Verificando frontend...")
        print("   Iniciando servidor frontend...")
        frontend_process = subprocess.Popen(
            ["npm", "run", "dev"],
            cwd="frontend",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        print("\n=== APLICAÇÃO RODANDO ===")
        print("   Backend: http://localhost:8000")
        print("   Frontend: http://localhost:3000")
        print("\nPressione Ctrl+C para parar ambos os servidores.")

        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nParando servidores...")
            backend_process.terminate()
            frontend_process.terminate()
            backend_process.wait()
            frontend_process.wait()
            print("Servidores parados com sucesso!")

    except subprocess.CalledProcessError as e:
        print(f"Erro ao executar aplicação: {e}")

if __name__ == "__main__":
    test_complete()