import subprocess
import sys
import os

def deploy_vercel():
    try:
        # Instalar dependências
        print("Instalando dependências...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])

        # Criar arquivo vercel.json se não existir
        vercel_config = {
            "version": 2,
            "builds": [
                {
                    "src": "api/**/*.py",
                    "use": "@vercel/python"
                }
            ],
            "routes": [
                {
                    "src": "/api/(.*)",
                    "dest": "/api/$1"
                }
            ]
        }

        # Verificar se vercel.json já existe
        if not os.path.exists("vercel.json"):
            import json
            with open("vercel.json", "w") as f:
                json.dump(vercel_config, f, indent=2)
            print("Arquivo vercel.json criado com sucesso!")

        # Instruções para deploy
        print("\n=== DEPLOY NA VERCEL ===")
        print("1. Instale a CLI Vercel: npm install -g vercel")
        print("2. Faça login: vercel login")
        print("3. Deploy: vercel --prod")
        print("4. Configure as variáveis de ambiente no dashboard Vercel:")
        print("   - MONGODB_URI: sua-string-de-conexao-mongodb")
        print("   - OASYF_API_KEY: sua-chave-da-api-oasyfy")
        print("   - ALLOWED_ORIGINS: https://seusite.vercel.app")
        print("\nApós o deploy, acesse sua URL da Vercel para testar!")

    except subprocess.CalledProcessError as e:
        print(f"Erro ao preparar deploy: {e}")

if __name__ == "__main__":
    deploy_vercel()