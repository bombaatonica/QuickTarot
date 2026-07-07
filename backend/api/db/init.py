import logging

from .transactions import create_transaction_index
from .mongodb import get_database

logger = logging.getLogger(__name__)


def init_database():
    """Inicializa o banco de dados criando índices necessários"""
    try:
        create_transaction_index()
        db = get_database()
        # Índice único de email: lookups de login rápidos e impede
        # cadastros duplicados mesmo sob concorrência
        db.users.create_index("email", unique=True)
        logger.info("Índices criados com sucesso")
    except Exception:
        logger.exception("Erro ao inicializar banco de dados")

if __name__ == "__main__":
    init_database()