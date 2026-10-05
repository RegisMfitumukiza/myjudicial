"""Apply pgvector migration or report status"""
import asyncio
from app.db.database import db

async def main():
    await db.connect()
    try:
        print("Attempting to enable vector extension...")
        await db.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        print("Extension vector successfully created/verified!")
    except Exception as e:
        print("Failed to create vector extension:", e)
        
    try:
        ext = await db.fetchrow("SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'")
        print("pg_extension check:", dict(ext) if ext else "None")
    except Exception as e:
        print("Check failed:", e)

    # Let's check if we can add columns
    try:
        print("Adding profile_embedding column...")
        await db.execute("ALTER TABLE experts ADD COLUMN IF NOT EXISTS profile_embedding vector(384);")
        await db.execute("ALTER TABLE experts ADD COLUMN IF NOT EXISTS embedding_model TEXT DEFAULT 'all-MiniLM-L6-v2';")
        await db.execute("ALTER TABLE experts ADD COLUMN IF NOT EXISTS embedding_generated_at TIMESTAMP;")
        print("Columns added successfully!")
    except Exception as e:
        print("Column add error:", e)

    # Create index
    try:
        print("Creating HNSW index...")
        await db.execute("""
            CREATE INDEX IF NOT EXISTS experts_embedding_hnsw_idx 
            ON experts 
            USING hnsw (profile_embedding vector_cosine_ops)
            WITH (m = 16, ef_construction = 64);
        """)
        print("Index created successfully!")
    except Exception as e:
        print("Index error:", e)

    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
