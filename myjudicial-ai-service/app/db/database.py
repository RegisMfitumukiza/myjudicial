"""Database connection and utilities"""
import asyncpg
from typing import Optional
import logging
from app.config import settings

logger = logging.getLogger(__name__)


class Database:
    """Async PostgreSQL database connection manager"""
    
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
    
    async def connect(self):
        """Create database connection pool"""
        if self.pool is None:
            try:
                self.pool = await asyncpg.create_pool(
                    dsn=settings.DATABASE_URL,
                    min_size=2,
                    max_size=10,
                    command_timeout=60,
                    statement_cache_size=0  # Disable for pgbouncer compatibility
                )
                logger.info("Database connection pool created")
            except Exception as e:
                logger.error(f"Failed to create database pool: {e}", exc_info=True)
                raise
    
    async def disconnect(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            self.pool = None
            logger.info("Database connection pool closed")
    
    async def execute(self, query: str, *args):
        """Execute a query without returning results"""
        if not self.pool:
            await self.connect()
        
        async with self.pool.acquire() as conn:
            return await conn.execute(query, *args)
    
    async def fetch(self, query: str, *args):
        """Fetch multiple rows"""
        if not self.pool:
            await self.connect()
        
        async with self.pool.acquire() as conn:
            return await conn.fetch(query, *args)
    
    async def fetchrow(self, query: str, *args):
        """Fetch a single row"""
        if not self.pool:
            await self.connect()
        
        async with self.pool.acquire() as conn:
            return await conn.fetchrow(query, *args)
    
    async def fetchval(self, query: str, *args):
        """Fetch a single value"""
        if not self.pool:
            await self.connect()
        
        async with self.pool.acquire() as conn:
            return await conn.fetchval(query, *args)


# Global database instance
db = Database()

