from pymongo import MongoClient
from pymongo.database import Database
import os
from typing import Optional

client: Optional[MongoClient] = None
db: Optional[Database] = None


def get_database() -> Database:
    """Retorna a conexão com o banco de dados MongoDB"""
    global db
    if db is None:
        mongodb_uri = os.getenv("MONGODB_URI")
        if not mongodb_uri:
            raise ValueError("MONGODB_URI não está definida nas variáveis de ambiente")
        
        global client
        client = MongoClient(mongodb_uri)
        # Extrai o nome do banco da URI ou usa 'quicktarot' como padrão
        db_name = mongodb_uri.split('/')[-1].split('?')[0] if '/' in mongodb_uri else 'quicktarot'
        db = client[db_name] if db_name else client.get_database('quicktarot')
    return db


def close_database():
    """Fecha a conexão com o banco de dados"""
    global client, db
    if client:
        client.close()
        client = None
        db = None
