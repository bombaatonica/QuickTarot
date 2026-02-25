from .transactions import create_transaction_index
from .mongodb import get_database

def init_database():
    """Inicializa o banco de dados criando índices necessários"""
    try:
        create_transaction_index()
        print("Índices de transações criados com sucesso!")
    except Exception as e:
        print(f"Erro ao inicializar banco de dados: {str(e)}")

if __name__ == "__main__":
    init_database()