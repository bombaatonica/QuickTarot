import subprocess
import sys
import os

def test_backend_import():
    try:
        print("=== TESTE DE IMPORTAÇÃO DO BACKEND ===")
        print("1. Instalando dependências...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "backend/requirements.txt"])

        print("\n2. Testando importação dos módulos...")
        try:
            # Testar importação dos módulos principais
            import pymongo
            from flask import Flask
            from flask_cors import CORS
            from dotenv import load_dotenv
            import os

            print("✅ Módulos importados com sucesso!")
            print("   - pymongo")
            print("   - flask")
            print("   - flask-cors")
            print("   - python-dotenv")

            # Testar importação das rotas
            print("\n3. Testando importação das rotas...")
            from backend.api.main import app
            print("✅ Rotas importadas com sucesso!")

            # Testar se app é uma instância Flask
            if isinstance(app, Flask):
                print("✅ App é uma instância Flask válida!")
            else:
                print("❌ App não é uma instância Flask válida")

            # Testar se as rotas estão registradas
            print("\n4. Verificando rotas registradas...")
            routes = [rule.rule for rule in app.url_map.iter_rules()]
            print(f"✅ {len(routes)} rotas registradas:")
            for route in routes:
                print(f"   - {route}")

        except Exception as e:
            print(f"❌ Erro ao importar módulos: {e}")

    except subprocess.CalledProcessError as e:
        print(f"Erro ao executar aplicação: {e}")

if __name__ == "__main__":
    test_backend_import()