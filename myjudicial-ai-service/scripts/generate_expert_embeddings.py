"""
Script to generate embeddings for all expert profiles

This script:
1. Connects to the database
2. Fetches all approved experts
3. Generates embeddings for their profiles
4. Updates the database with embeddings

Usage:
    python scripts/generate_expert_embeddings.py
    
    # Generate for specific experts
    python scripts/generate_expert_embeddings.py --expert-ids uuid1,uuid2,uuid3
    
    # Force regenerate all embeddings
    python scripts/generate_expert_embeddings.py --force
"""

import asyncio
import sys
import os
import argparse
import logging
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.embedding_service import embedding_service
from app.db.repositories.expert_repository import expert_repository
from app.db.database import db
from app.config import settings

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def generate_embeddings_for_experts(
    expert_ids: list = None,
    force_regenerate: bool = False
):
    """
    Generate embeddings for expert profiles
    
    Args:
        expert_ids: List of specific expert IDs to process (None = all)
        force_regenerate: Regenerate even if embedding exists
    """
    try:
        start_time = datetime.now()
        
        # Connect to database
        logger.info("Connecting to database...")
        await db.connect()
        logger.info("Database connected")
        
        # Get experts to process
        if expert_ids:
            logger.info(f"Fetching {len(expert_ids)} specific experts...")
            experts = []
            for expert_id in expert_ids:
                expert = await expert_repository.get_expert_by_id(expert_id)
                if expert:
                    experts.append(expert)
                else:
                    logger.warning(f"Expert not found: {expert_id}")
        else:
            logger.info("Fetching all experts (regardless of status)...")
            experts = await expert_repository.get_all_experts(status=None, limit=1000)
        
        total_experts = len(experts)
        logger.info(f"Found {total_experts} experts to process")
        
        if total_experts == 0:
            logger.warning("No experts found!")
            return
        
        # Statistics
        generated = 0
        skipped = 0
        failed = 0
        
        # Process each expert
        logger.info("Starting embedding generation...")
        print("\n" + "="*80)
        
        for i, expert in enumerate(experts, 1):
            expert_name = expert.get('full_name', 'Unknown')
            expert_id = expert.get('id')
            
            try:
                # Skip if already has embedding (unless force regenerate)
                if expert.get('has_embedding') and not force_regenerate:
                    skipped += 1
                    logger.info(
                        f"[{i}/{total_experts}] SKIP: {expert_name} "
                        f"(already has embedding)"
                    )
                    continue
                
                # Create profile text
                profile_text = await embedding_service.create_expert_profile_text(expert)
                logger.debug(f"Profile text for {expert_name}: {profile_text[:100]}...")
                
                # Generate embedding
                logger.info(f"[{i}/{total_experts}] Generating embedding for: {expert_name}")
                embedding = await embedding_service.generate_embedding(profile_text)
                
                # Update in database
                success = await expert_repository.update_expert_embedding(
                    expert_id=expert_id,
                    embedding=embedding,
                    model_name=settings.EMBEDDING_MODEL
                )
                
                if success:
                    generated += 1
                    logger.info(
                        f"[{i}/{total_experts}] ✓ SUCCESS: {expert_name} "
                        f"(dim: {len(embedding)})"
                    )
                    print(f"✓ {expert_name}")
                else:
                    failed += 1
                    logger.error(f"[{i}/{total_experts}] ✗ FAILED to save: {expert_name}")
                    print(f"✗ {expert_name} (database error)")
            
            except Exception as e:
                failed += 1
                logger.error(
                    f"[{i}/{total_experts}] ✗ ERROR processing {expert_name}: {e}",
                    exc_info=True
                )
                print(f"✗ {expert_name} (error: {str(e)[:50]})")
        
        # Calculate statistics
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        print("="*80)
        print("\n📊 EMBEDDING GENERATION COMPLETE\n")
        print(f"Total experts:      {total_experts}")
        print(f"✓ Generated:        {generated}")
        print(f"⊘ Skipped:          {skipped}")
        print(f"✗ Failed:           {failed}")
        print(f"⏱ Processing time:  {duration:.2f} seconds")
        print(f"⚡ Avg per expert:   {duration/total_experts:.2f} seconds")
        print(f"📐 Model:            {settings.EMBEDDING_MODEL}")
        print(f"📏 Dimensions:       {settings.EMBEDDING_DIM}")
        
        # Show embedding stats
        print("\n📈 DATABASE STATISTICS\n")
        stats = await expert_repository.get_embedding_stats()
        print(f"Total experts:           {stats.get('total_experts', 0)}")
        print(f"With embeddings:         {stats.get('experts_with_embeddings', 0)}")
        print(f"Without embeddings:      {stats.get('experts_without_embeddings', 0)}")
        print(f"Coverage:                {stats.get('embedding_coverage_percentage', 0):.1f}%")
        
        if stats.get('first_embedding_generated'):
            print(f"First generated:         {stats['first_embedding_generated']}")
        if stats.get('last_embedding_generated'):
            print(f"Last generated:          {stats['last_embedding_generated']}")
        
        print("\n" + "="*80 + "\n")
        
        # Close database connection
        await db.disconnect()
        logger.info("Database connection closed")
        
        return {
            "total": total_experts,
            "generated": generated,
            "skipped": skipped,
            "failed": failed,
            "duration": duration
        }
    
    except Exception as e:
        logger.error(f"Script failed: {e}", exc_info=True)
        print(f"\n❌ ERROR: {str(e)}\n")
        sys.exit(1)


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Generate embeddings for expert profiles"
    )
    parser.add_argument(
        '--expert-ids',
        type=str,
        help='Comma-separated list of expert UUIDs to process (default: all)'
    )
    parser.add_argument(
        '--force',
        action='store_true',
        help='Force regenerate embeddings even if they already exist'
    )
    
    args = parser.parse_args()
    
    # Parse expert IDs
    expert_ids = None
    if args.expert_ids:
        expert_ids = [id.strip() for id in args.expert_ids.split(',')]
        logger.info(f"Processing specific experts: {expert_ids}")
    
    # Print configuration
    print("\n" + "="*80)
    print("🚀 EXPERT EMBEDDING GENERATION")
    print("="*80)
    print(f"\nConfiguration:")
    print(f"  Database:     {settings.DATABASE_URL[:50]}...")
    print(f"  Model:        {settings.EMBEDDING_MODEL}")
    print(f"  Dimensions:   {settings.EMBEDDING_DIM}")
    print(f"  Device:       {settings.EMBEDDING_DEVICE}")
    print(f"  Batch size:   {settings.EMBEDDING_BATCH_SIZE}")
    print(f"  Expert IDs:   {expert_ids if expert_ids else 'All approved experts'}")
    print(f"  Force regen:  {args.force}")
    print("\n" + "="*80 + "\n")
    
    # Run async function
    asyncio.run(generate_embeddings_for_experts(
        expert_ids=expert_ids,
        force_regenerate=args.force
    ))


if __name__ == "__main__":
    main()

