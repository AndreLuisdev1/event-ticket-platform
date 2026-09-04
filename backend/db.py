import os
import aiomysql
import ssl
from dotenv import load_dotenv

load_dotenv()

pool: aiomysql.Pool | None = None


def get_ssl_context() -> ssl.SSLContext | None:
    if os.getenv("DB_SSL", "false").lower() not in {"1", "true", "yes"}:
        return None

    ca_file = os.getenv("DB_SSL_CA")
    return ssl.create_default_context(cafile=ca_file) if ca_file else ssl.create_default_context()


async def init_db():
    global pool
    pool = await aiomysql.create_pool(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USER", "devuser"),
        password=os.getenv("DB_PASSWORD", "devpassword"),
        db=os.getenv("DB_NAME", "cinema_db"),
        autocommit=True,
        ssl=get_ssl_context(),
        minsize=1,
        maxsize=10 #Define o tamanho máximo do pool de conexões, deixarei um número razoável para evitar sobrecarga no banco de dados, mas ainda permitir um teste robusto.
    )

async def close_db():
    global pool
    if pool:
        pool.close()
        await pool.wait_closed()

async def fetch_all(query: str, params: tuple = ()):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(query, params)
            return await cur.fetchall()

async def fetch_one(query: str, params: tuple = ()):
    async with pool.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(query, params)
            return await cur.fetchone()

async def execute_query(query: str, params: tuple = ()):
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, params)
            return cur.lastrowid

async def execute_update(query: str, params: tuple = ()):
    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, params)
            return cur.rowcount