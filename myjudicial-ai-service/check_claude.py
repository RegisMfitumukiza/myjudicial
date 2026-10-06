import asyncio, asyncpg, os
from dotenv import load_dotenv

load_dotenv('E:/myJudicial/myjudicial-ai-service/.env')
url = os.getenv('DATABASE_URL')

async def main():
    conn = await asyncpg.connect(url, statement_cache_size=0)
    row = await conn.fetchrow("SELECT * FROM experts WHERE 'CRIMINAL_LAW' = ANY(specialties)")
    if row:
        for k in row.keys():
            if k != 'profile_embedding':
                print(f"{k}: {row[k]}")
    else:
        print("No row found for CRIMINAL_LAW!")
    await conn.close()

if __name__ == '__main__':
    asyncio.run(main())
