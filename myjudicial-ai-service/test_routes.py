"""Test if routes are loaded"""
from app.main import app

print("All routes in app:")
for route in app.routes:
    if hasattr(route, 'path'):
        print(f"  {route.path}")

print(f"\nTotal routes: {len(app.routes)}")
