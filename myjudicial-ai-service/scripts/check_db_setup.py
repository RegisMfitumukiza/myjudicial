"""Quick script to check if database is ready for embeddings"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.db.database import db
from app.config import settings


async def check_database_setup():
    """Check if pgvector is set up properly"""
    print("\n" + "="*80)
    print("🔍 CHECKING DATABASE SETUP FOR EMBEDDINGS")
    print("="*80 + "\n")
    
    try:
        # Connect to database
        print("Connecting to database...")
        await db.connect()
        print("✅ Database connected\n")
        
        # Check pgvector extension
        print("1. Checking pgvector extension...")
        result = await db.fetchrow("""
            SELECT COUNT(*) as count 
            FROM pg_extension 
            WHERE extname = 'vector'
        """)
        
        if result and result['count'] > 0:
            print("   ✅ pgvector extension enabled")
        else:
            print("   ❌ pgvector extension NOT enabled")
            print("   ⚠️  Run scripts/setup_pgvector.sql in Supabase first!")
            await db.disconnect()
            return False
        
        # Check profile_embedding column
        print("\n2. Checking profile_embedding column...")
        result = await db.fetchrow("""
            SELECT COUNT(*) as count
            FROM information_schema.columns 
            WHERE table_name = 'experts' 
            AND column_name = 'profile_embedding'
        """)
        
        if result and result['count'] > 0:
            print("   ✅ profile_embedding column exists")
        else:
            print("   ❌ profile_embedding column NOT found")
            print("   ⚠️  Run scripts/setup_pgvector.sql in Supabase first!")
            await db.disconnect()
            return False
        
        # Check HNSW index
        print("\n3. Checking HNSW index...")
        result = await db.fetchrow("""
            SELECT COUNT(*) as count
            FROM pg_indexes 
            WHERE tablename = 'experts' 
            AND indexname = 'experts_embedding_hnsw_idx'
        """)
        
        if result and result['count'] > 0:
            print("   ✅ HNSW index created")
        else:
            print("   ⚠️  HNSW index not found (will be slower, but not critical)")
        
        # Check experts count
        print("\n4. Checking experts in database...")
        result = await db.fetchrow("""
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status::text = 'APPROVED' THEN 1 END) as approved,
                COUNT(profile_embedding) as with_embeddings
            FROM experts
        """)
        
        if not result:
            print("   ❌ Could not query experts table")
            await db.disconnect()
            return False
        
        print(f"   Total experts: {result['total']}")
        print(f"   Approved experts: {result['approved']}")
        print(f"   Already have embeddings: {result['with_embeddings']}")
        
        if result['total'] == 0:
            print("   ⚠️  No experts found in database!")
            print("   ⚠️  Add some experts first before generating embeddings")
            await db.disconnect()
            return False
        
        # Success!
        print("\n" + "="*80)
        print("✅ DATABASE IS READY FOR EMBEDDING GENERATION!")
        print("="*80)
        print(f"\n📊 Summary:")
        print(f"   - pgvector: Enabled")
        print(f"   - Vector column: Ready")
        print(f"   - Total experts: {result['total']}")
        print(f"   - Approved experts: {result['approved']}")
        print(f"   - Need embeddings: {result['total'] - result['with_embeddings']}")
        print(f"\n✨ Next step:")
        print(f"   Run: python scripts/generate_expert_embeddings.py")
        print(f"   (This will process ALL experts, regardless of status)")
        print("="*80 + "\n")
        
        await db.disconnect()
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print("\nPossible issues:")
        print("1. Database not accessible")
        print("2. pgvector not set up - run scripts/setup_pgvector.sql in Supabase")
        print("3. Wrong database credentials in .env")
        try:
            await db.disconnect()
        except:
            pass
        return False


if __name__ == "__main__":
    success = asyncio.run(check_database_setup())
    sys.exit(0 if success else 1)
