#!/bin/bash

# MyJudicial Health Check Script
# Run this to verify all services are running correctly

echo "🏥 MyJudicial Health Check"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Health check function
check_service() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" -eq "$expected_code" ]; then
        echo -e "${GREEN}✓${NC} $name: OK (HTTP $response)"
        return 0
    else
        echo -e "${RED}✗${NC} $name: FAILED (HTTP $response)"
        return 1
    fi
}

# Check if running inside OCI instance or locally
if [ -f /etc/oci-hostname ]; then
    HOST="localhost"
else
    HOST="localhost"
fi

echo "Checking services on: $HOST"
echo ""

# Track failures
failures=0

# 1. Backend API
echo "1. Backend API..."
if check_service "Backend Health" "http://$HOST:3000/health"; then
    :
else
    ((failures++))
fi

# 2. Redis
echo ""
echo "2. Redis..."
if docker compose -f docker-compose.prod.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Redis: OK"
else
    echo -e "${RED}✗${NC} Redis: FAILED"
    ((failures++))
fi

# 3. PostgreSQL (if self-hosted)
echo ""
echo "3. PostgreSQL..."
if docker ps | grep -q myjudicial-postgres; then
    if docker compose -f docker-compose.prod.yml exec -T postgres pg_isready > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} PostgreSQL: OK"
    else
        echo -e "${RED}✗${NC} PostgreSQL: FAILED"
        ((failures++))
    fi
else
    echo -e "${YELLOW}⊘${NC} PostgreSQL: Not running (using external DB)"
fi

# fi

# 5. LiveKit
echo ""
echo "5. LiveKit..."
if nc -zv localhost 7880 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} LiveKit: OK (port 7880 open)"
else
    echo -e "${RED}✗${NC} LiveKit: FAILED (port 7880 not accessible)"
    ((failures++))
fi

# 6. Ollama
echo ""
echo "6. Ollama..."
if check_service "Ollama" "http://$HOST:11434" 200; then
    :
else
    ((failures++))
fi

# 7. Nginx Proxy Manager
echo ""
echo "7. Nginx Proxy Manager..."
if nc -zv localhost 81 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Nginx Admin: OK (port 81 open)"
else
    echo -e "${RED}✗${NC} Nginx Admin: FAILED"
    ((failures++))
fi


# Check Docker containers
echo ""
echo "8. Docker Containers Status..."
echo ""
docker compose -f docker-compose.prod.yml ps

# System resources
echo ""
echo "9. System Resources..."
echo ""
echo "Memory Usage:"
free -h | grep -E "^Mem:"
echo ""
echo "Disk Usage:"
df -h / | grep -E "^/"
echo ""
echo "CPU Load:"
uptime

# Summary
echo ""
echo "=========================="
if [ $failures -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ $failures check(s) failed${NC}"
    echo ""
    echo "Troubleshooting tips:"
    echo "1. Check logs: docker compose -f docker-compose.prod.yml logs -f"
    echo "2. Restart failed service: docker compose -f docker-compose.prod.yml restart <service>"
    echo "3. Check .env configuration"
    exit 1
fi
