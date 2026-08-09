import secrets
import string

def generate_secure_key(prefix='', length=32):
    chars = string.ascii_letters + string.digits + '-_'
    return f'{prefix}{''.join(secrets.choice(chars) for _ in range(length))}'

# Generate production API keys
backend_api_key = generate_secure_key('mk-', 32)
aio_api_key = generate_secure_key('ai-', 32)

print('Backend API Key:', backend_api_key)
print('AI Service API Key:', ai_api_key)
print()
print('To apply, edit myjudicial-backend/.env and update:')
print('  AI_SERVICE_KEY=', backend_api_key)
print('And in myjudicial-ai-service/.env:')
print('  API_KEY=', ai_api_key)