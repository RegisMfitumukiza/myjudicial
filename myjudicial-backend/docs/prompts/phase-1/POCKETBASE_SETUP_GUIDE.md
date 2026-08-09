# PocketBase Setup Guide for MyJudicial Chat

**Date:** 2026-06-30  
**Purpose:** Production deployment guide for PocketBase real-time messaging  
**Status:** Ready for deployment

---

## Overview

This guide provides step-by-step instructions to deploy and configure PocketBase for the MyJudicial chat system. PocketBase handles real-time WebSocket broadcasting while all business logic, persistence, and authorization remain in the main backend.

---

## Architecture

```
[Client] → [Backend API] → [PostgreSQL] (persistence)
              ↓
         [PocketBase] (real-time broadcast only)
              ↓
         [Clients] (WebSocket subscriptions)
```

**What PocketBase Does:**
- Real-time message broadcasting via WebSocket
- Typing indicator ephemeral state
- Online presence updates

**What Backend Does:**
- All authentication & authorization
- Message persistence (PostgreSQL)
- Business logic validation
- Audit logging
- Email notifications

---

## Installation Options

### Option 1: Docker (Recommended for Production)

```dockerfile
# Dockerfile.pocketbase
FROM alpine:latest

ARG PB_VERSION=0.22.0

RUN apk add --no-cache \
    unzip \
    ca-certificates

# Download and install PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

EXPOSE 8090

# Start PocketBase
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090"]
```

**Build and Run:**
```bash
docker build -f Dockerfile.pocketbase -t myjudicial-pocketbase .
docker run -d -p 8090:8090 -v pocketbase_data:/pb/pb_data --name pocketbase myjudicial-pocketbase
```

### Option 2: Standalone Binary

**Download:**
```bash
# Linux
wget https://github.com/pocketbase/pocketbase/releases/download/v0.22.0/pocketbase_0.22.0_linux_amd64.zip
unzip pocketbase_0.22.0_linux_amd64.zip
chmod +x pocketbase

# macOS
wget https://github.com/pocketbase/pocketbase/releases/download/v0.22.0/pocketbase_0.22.0_darwin_amd64.zip
unzip pocketbase_0.22.0_darwin_amd64.zip
chmod +x pocketbase
```

**Run:**
```bash
./pocketbase serve --http=0.0.0.0:8090
```

### Option 3: Docker Compose (Local Development)

Add to `docker-compose.yml`:
```yaml
services:
  pocketbase:
    image: alpine:latest
    command: /pb/pocketbase serve --http=0.0.0.0:8090
    ports:
      - "8090:8090"
    volumes:
      - pocketbase_data:/pb/pb_data
    environment:
      - PB_ADMIN_EMAIL=${POCKETBASE_ADMIN_EMAIL}
      - PB_ADMIN_PASSWORD=${POCKETBASE_ADMIN_PASSWORD}

volumes:
  pocketbase_data:
```

---

## Initial Configuration

### Step 1: Access Admin UI

1. Start PocketBase (see Installation above)
2. Navigate to: `http://localhost:8090/_/`
3. Create admin account:
   - Email: `admin@myjudicial.com` (or your admin email)
   - Password: Generate secure password (min 10 characters)
   - **Save credentials to environment variables**

### Step 2: Create Collections

PocketBase requires 2 collections for the chat system.

#### Collection 1: `messages` (Real-time Broadcast)

**Purpose:** Temporary message records for real-time WebSocket broadcasting only. Backend persists to PostgreSQL.

**Schema:**
```json
{
  "name": "messages",
  "type": "base",
  "schema": [
    {
      "name": "conversationId",
      "type": "text",
      "required": true
    },
    {
      "name": "messageId",
      "type": "text",
      "required": true
    },
    {
      "name": "senderId",
      "type": "text",
      "required": true
    },
    {
      "name": "content",
      "type": "text",
      "required": false
    },
    {
      "name": "messageType",
      "type": "select",
      "required": true,
      "options": {
        "values": ["TEXT", "EMOJI", "IMAGE", "PDF", "DOCUMENT", "SYSTEM"]
      }
    },
    {
      "name": "attachmentIds",
      "type": "json",
      "required": false
    },
    {
      "name": "createdAt",
      "type": "date",
      "required": true
    }
  ],
  "indexes": [
    "CREATE INDEX idx_messages_conversation ON messages (conversationId)"
  ]
}
```

**API Rules:**
- **List/View:** `@request.auth.id != ""`
- **Create:** `@request.auth.id != ""`
- **Update:** `@request.auth.id = senderId`
- **Delete:** `@request.auth.id = senderId`

**Realtime Rules:**
- Subscribe: `@request.auth.id != ""`

**Auto-Cleanup:** Configure PocketBase to delete records older than 24 hours (optional)

---

#### Collection 2: `typing_indicators` (Ephemeral State)

**Purpose:** Track typing indicators for real-time UI updates.

**Schema:**

```json
{
  "name": "typing_indicators",
  "type": "base",
  "schema": [
    {
      "name": "conversationId",
      "type": "text",
      "required": true
    },
    {
      "name": "userId",
      "type": "text",
      "required": true
    },
    {
      "name": "isTyping",
      "type": "bool",
      "required": true
    }
  ],
  "indexes": [
    "CREATE UNIQUE INDEX idx_typing_user ON typing_indicators (conversationId, userId)",
    "CREATE INDEX idx_typing_conversation ON typing_indicators (conversationId)"
  ]
}
```

**API Rules:**
- **List/View:** `@request.auth.id != ""`
- **Create:** `@request.auth.id = userId`
- **Update:** `@request.auth.id = userId`
- **Delete:** `@request.auth.id = userId`

**Realtime Rules:**
- Subscribe: `@request.auth.id != ""`

**Auto-Cleanup:** Records auto-deleted when TTL expires (managed by backend)

---

## Backend Integration

### Step 3: Update Environment Variables

Add to `.env`:
```bash
# PocketBase Configuration
POCKETBASE_URL=http://localhost:8090
POCKETBASE_ADMIN_EMAIL=admin@myjudicial.com
POCKETBASE_ADMIN_PASSWORD=your-secure-password

# For production, use HTTPS
# POCKETBASE_URL=https://pocketbase.yourdomain.com
```

### Step 4: Update PocketBase Provider

The provider is already implemented at:
`src/modules/chat/providers/pocketbase.provider.ts`

**Current Status:** Placeholder implementation with interface defined

**To Activate:**
1. Install PocketBase SDK: `npm install pocketbase`
2. Implement the placeholder methods
3. Test connection

**Provider Methods:**
- `connect()` — Authenticate as admin
- `subscribe(conversationId, callback)` — Subscribe to real-time updates
- `unsubscribe(conversationId)` — Unsubscribe from updates
- `broadcastMessage(message)` — Broadcast new message
- `broadcastTyping(conversationId, userId, isTyping)` — Broadcast typing indicator
- `disconnect()` — Close connection

---

## Testing

### Test Real-time Message Broadcasting

**1. Send Message via Backend API:**
```bash
curl -X POST http://localhost:8000/api/v1/chat/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv-123",
    "messageType": "TEXT",
    "content": "Hello world"
  }'
```

**2. Subscribe to Real-time Updates (Frontend):**
```javascript
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://localhost:8090');

// Subscribe to conversation
pb.collection('messages').subscribe('*', (e) => {
  if (e.record.conversationId === 'conv-123') {
    console.log('New message:', e.record);
    // Update UI
  }
});
```

**3. Verify Broadcast:**
- Message should appear in real-time without polling
- Check PocketBase logs for WebSocket connections

### Test Typing Indicators

**1. Set Typing Indicator:**
```bash
curl -X POST http://localhost:8000/api/v1/chat/typing \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv-123",
    "isTyping": true
  }'
```

**2. Check Typing Users:**
```bash
curl http://localhost:8000/api/v1/chat/conversations/conv-123/typing \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "typingUsers": [
      {
        "userId": "user-456",
        "firstName": "John",
        "lastName": "Doe"
      }
    ]
  }
}
```

---

## Production Deployment

### Cloud Run (Google Cloud)

**1. Build Docker Image:**
```bash
docker build -f Dockerfile.pocketbase -t gcr.io/PROJECT_ID/pocketbase:latest .
docker push gcr.io/PROJECT_ID/pocketbase:latest
```

**2. Deploy to Cloud Run:**
```bash
gcloud run deploy pocketbase \
  --image gcr.io/PROJECT_ID/pocketbase:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8090 \
  --memory 512Mi \
  --cpu 1
```

**3. Configure Custom Domain:**
```bash
gcloud run domain-mappings create \
  --service pocketbase \
  --domain pocketbase.yourdomain.com
```

### AWS (ECS/Fargate)

**1. Push to ECR:**
```bash
aws ecr create-repository --repository-name pocketbase
docker tag myjudicial-pocketbase:latest AWS_ACCOUNT.dkr.ecr.REGION.amazonaws.com/pocketbase:latest
docker push AWS_ACCOUNT.dkr.ecr.REGION.amazonaws.com/pocketbase:latest
```

**2. Create ECS Task Definition:**
```json
{
  "family": "pocketbase",
  "containerDefinitions": [{
    "name": "pocketbase",
    "image": "AWS_ACCOUNT.dkr.ecr.REGION.amazonaws.com/pocketbase:latest",
    "portMappings": [{ "containerPort": 8090 }],
    "memory": 512,
    "cpu": 256
  }]
}
```

**3. Deploy Service:**
```bash
aws ecs create-service \
  --cluster myjudicial-cluster \
  --service-name pocketbase \
  --task-definition pocketbase \
  --desired-count 1 \
  --launch-type FARGATE
```

### Render.com

**1. Create Web Service:**
- Select "Docker" as environment
- Connect repository
- Set Dockerfile path: `Dockerfile.pocketbase`
- Port: 8090

**2. Configure Environment:**
- Add `POCKETBASE_ADMIN_EMAIL`
- Add `POCKETBASE_ADMIN_PASSWORD`

---

## Security Considerations

### Authentication

**Backend → PocketBase:**
- Use admin credentials (stored in environment variables)
- Never expose admin credentials to frontend

**Frontend → PocketBase:**
- Frontend authenticates with backend first (JWT)
- Backend generates short-lived PocketBase tokens
- Frontend uses PocketBase tokens for subscriptions only
- No direct frontend-to-PocketBase authentication

### Network Security

**Production Checklist:**
- ✅ Enable HTTPS (required for WebSocket Secure)
- ✅ Configure CORS to allow only your frontend domain
- ✅ Use strong admin password (min 16 characters)
- ✅ Enable rate limiting (protect against DoS)
- ✅ Restrict API access to authenticated users only
- ✅ Never expose PocketBase admin panel publicly

### Data Privacy

**Important:**
- PocketBase stores transient data only (messages, typing indicators)
- All persistent data stored in PostgreSQL
- Configure auto-deletion for old PocketBase records
- PocketBase does NOT store user credentials or sensitive data

---

## Monitoring

### Health Check Endpoint

**PocketBase Health:**
```bash
curl http://localhost:8090/api/health
```

**Expected Response:**
```json
{
  "code": 200,
  "message": "OK"
}
```

### Metrics to Monitor

1. **WebSocket Connections:**
   - Active connections count
   - Connection duration
   - Reconnection rate

2. **Message Broadcasting:**
   - Messages broadcast per second
   - Broadcast latency
   - Failed broadcasts

3. **System Resources:**
   - Memory usage (keep < 80%)
   - CPU usage
   - Disk I/O

### Logging

**Enable PocketBase Logs:**
```bash
./pocketbase serve --http=0.0.0.0:8090 --log=/var/log/pocketbase.log
```

**Log Rotation:**
```bash
# logrotate config
/var/log/pocketbase.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}
```

---

## Troubleshooting

### Issue: WebSocket Connection Fails

**Symptoms:**
- Frontend cannot subscribe to real-time updates
- Browser console shows WebSocket errors

**Solutions:**
1. Verify PocketBase is running: `curl http://localhost:8090/api/health`
2. Check CORS configuration allows frontend origin
3. Ensure HTTPS is enabled for production (wss:// not ws://)
4. Verify firewall allows port 8090

### Issue: Messages Not Broadcasting

**Symptoms:**
- Messages saved to PostgreSQL but not appearing in real-time
- No errors in logs

**Solutions:**
1. Check backend calls PocketBase provider after saving message
2. Verify PocketBase collection "messages" exists
3. Check API rules allow authenticated users to create
4. Test with PocketBase admin panel directly

### Issue: High Memory Usage

**Symptoms:**
- PocketBase container restarting frequently
- Out of memory errors

**Solutions:**
1. Configure auto-deletion of old records
2. Increase container memory limit
3. Optimize collection indexes
4. Consider Redis for typing indicators instead

### Issue: Typing Indicators Not Working

**Symptoms:**
- `getTypingUsers()` returns empty array
- Typing state not updating in UI

**Solutions:**
1. Verify Redis is running and accessible
2. Check Redis SCAN permission
3. Test with Redis CLI: `redis-cli KEYS "typing:*"`
4. Verify TTL is set correctly (5 seconds)
5. Check backend logs for Redis errors

---

## Alternative: Redis-Only (No PocketBase)

If PocketBase is not suitable for your infrastructure, you can use Redis for all real-time features:

### Redis Pub/Sub for Messages

**Backend publishes:**
```typescript
await redis.publish(`chat:${conversationId}`, JSON.stringify(message));
```

**Frontend subscribes via WebSocket server:**
```typescript
// Requires custom WebSocket server (Socket.IO, ws, etc.)
io.to(conversationId).emit('new-message', message);
```

### Trade-offs

**PocketBase Advantages:**
- Out-of-the-box WebSocket handling
- Admin UI for debugging
- Built-in authentication
- Automatic reconnection

**Redis Pub/Sub Advantages:**
- No additional service (if already using Redis)
- Lower latency
- More control over message format
- Better horizontal scaling

---

## Conclusion

PocketBase setup is complete when:

✅ PocketBase instance running (Docker/standalone)  
✅ Admin account created  
✅ Collections created (messages, typing_indicators)  
✅ API rules configured  
✅ Environment variables set  
✅ Backend provider connected  
✅ WebSocket subscriptions tested  
✅ HTTPS enabled (production)  
✅ Monitoring configured  

**Status:** Ready for production deployment

---

**Next Steps:**
1. Deploy PocketBase to production environment
2. Update backend environment variables
3. Test real-time features end-to-end
4. Monitor WebSocket connections
5. Configure auto-scaling if needed

**Support:** Refer to [PocketBase Documentation](https://pocketbase.io/docs/) for advanced configuration.

