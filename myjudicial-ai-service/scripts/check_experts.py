"""Check expert status and optionally approve them"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.db.database import db


async def check_experts():
    """Check expert status"""
    print("\n" + "="*80)
    print("👥 CHECKING EXPERT STATUS")
    print("="*80 + "\n")
    
    try:
        await db.connect()
        print("✅ Database connected\n")
        
        # Get all experts with their status
        experts = await db.fetch("""
            SELECT 
                id,
                "displayName",
                status::text as status,
                "primarySpecialty"::text as primary_specialty,
                "yearsExperience",
                "baseConsultationFee"
            FROM experts
            ORDER BY "createdAt" DESC
        """)
        
        if not experts:
            print("❌ No experts found in database!")
            await db.disconnect()
            return
        
        print(f"Found {len(experts)} expert(s):\n")
        print("-" * 80)
        
        for i, expert in enumerate(experts, 1):
            print(f"\n{i}. {expert['displayName']}")
            print(f"   ID: {expert['id']}")
            print(f"   Status: {expert['status']}")
            print(f"   Specialty: {expert['primary_specialty']}")
            print(f"   Experience: {expert['yearsExperience']} years")
            print(f"   Fee: {expert['baseConsultationFee']} RWF")
        
        print("\n" + "-" * 80)
        
        # Count by status
        status_counts = {}
        for expert in experts:
            status = expert['status']
            status_counts[status] = status_counts.get(status, 0) + 1
        
        print(f"\n📊 Status Summary:")
        for status, count in status_counts.items():
            print(f"   {status}: {count}")
        
        # Check what statuses are possible
        print(f"\n💡 Possible Status Values:")
        enum_values = await db.fetch("""
            SELECT unnest(enum_range(NULL::"ExpertStatus"))::text as status
        """)
        for val in enum_values:
            print(f"   - {val['status']}")
        
        await db.disconnect()
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        try:
            await db.disconnect()
        except:
            pass


if __name__ == "__main__":
    asyncio.run(check_experts())
