#!/bin/bash

# MyJudicial Maintenance Script
# Provides common maintenance operations

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

COMPOSE_FILE="docker-compose.prod.yml"

show_menu() {
    echo ""
    echo -e "${BLUE}  MyJudicial Maintenance Menu${NC}"
    echo "================================"
    echo ""
    echo "1.  View service status"
    echo "2.  View logs (all services)"
    echo "3.  View logs (specific service)"
    echo "4.  Restart all services"
    echo "5.  Restart specific service"
    echo "6.  Stop all services"
    echo "7.  Start all services"
    echo "8.  Update and rebuild"
    echo "9.  Database backup"
    echo "10. Database restore"
    echo "11. Clean up Docker resources"
    echo "12. View resource usage"
    echo "13. Run migrations"
    echo "14. Seed database"
    echo "15. Pull AI models"
    echo "16. Check system health"
    echo "17. View disk usage"
    echo "18. Rotate logs"
    echo "0.  Exit"
    echo ""
    read -p "Enter your choice: " choice
}

view_status() {
    echo -e "${BLUE}Service Status:${NC}"
    docker compose -f $COMPOSE_FILE ps
}

view_all_logs() {
    echo -e "${BLUE}Viewing all logs (Ctrl+C to exit)...${NC}"
    docker compose -f $COMPOSE_FILE logs -f --tail=100
}

view_service_logs() {
    echo ""
    echo "Available services:"
    docker compose -f $COMPOSE_FILE config --services
    echo ""
    read -p "Enter service name: " service
    echo -e "${BLUE}Viewing logs for $service (Ctrl+C to exit)...${NC}"
    docker compose -f $COMPOSE_FILE logs -f --tail=100 $service
}

restart_all() {
    echo -e "${YELLOW}Restarting all services...${NC}"
    docker compose -f $COMPOSE_FILE restart
    echo -e "${GREEN}✓${NC} All services restarted"
}

restart_service() {
    echo ""
    echo "Available services:"
    docker compose -f $COMPOSE_FILE config --services
    echo ""
    read -p "Enter service name: " service
    echo -e "${YELLOW}Restarting $service...${NC}"
    docker compose -f $COMPOSE_FILE restart $service
    echo -e "${GREEN}✓${NC} $service restarted"
}

stop_all() {
    read -p "Are you sure you want to stop all services? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Stopping all services...${NC}"
        docker compose -f $COMPOSE_FILE down
        echo -e "${GREEN}✓${NC} All services stopped"
    fi
}

start_all() {
    echo -e "${YELLOW}Starting all services...${NC}"
    docker compose -f $COMPOSE_FILE up -d
    echo -e "${GREEN}✓${NC} All services started"
}

update_rebuild() {
    echo -e "${YELLOW}Pulling latest changes...${NC}"
    git pull
    
    echo -e "${YELLOW}Rebuilding images...${NC}"
    docker compose -f $COMPOSE_FILE build --no-cache
    
    echo -e "${YELLOW}Restarting services...${NC}"
    docker compose -f $COMPOSE_FILE up -d
    
    echo -e "${GREEN}✓${NC} Update and rebuild complete"
}

backup_database() {
    BACKUP_DIR=~/backups
    mkdir -p $BACKUP_DIR
    DATE=$(date +%Y%m%d_%H%M%S)
    
    echo -e "${YELLOW}Creating database backup...${NC}"
    
    # Check if PostgreSQL container is running
    if docker ps | grep -q myjudicial-postgres; then
        docker compose -f $COMPOSE_FILE exec -T postgres \
            pg_dump -U postgres myjudicial | gzip > $BACKUP_DIR/db_$DATE.sql.gz
        echo -e "${GREEN}✓${NC} PostgreSQL backup saved to: $BACKUP_DIR/db_$DATE.sql.gz"
    else
        echo -e "${YELLOW}⊘${NC} PostgreSQL container not running (using external DB?)"
    fi
}

restore_database() {
    BACKUP_DIR=~/backups
    
    echo "Available backups:"
    ls -lh $BACKUP_DIR/*.sql.gz 2>/dev/null || echo "No backups found"
    echo ""
    read -p "Enter backup filename (just the name, not full path): " backup_file
    
    if [ ! -f "$BACKUP_DIR/$backup_file" ]; then
        echo -e "${RED}✗${NC} Backup file not found!"
        return
    fi
    
    read -p "Are you sure you want to restore from this backup? This will overwrite current data! (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Restoring database...${NC}"
        gunzip -c $BACKUP_DIR/$backup_file | docker compose -f $COMPOSE_FILE exec -T postgres \
            psql -U postgres myjudicial
        echo -e "${GREEN}✓${NC} Database restored"
    fi
}

cleanup_docker() {
    echo -e "${YELLOW}Cleaning up Docker resources...${NC}"
    
    # Show what will be removed
    echo "Images that will be removed:"
    docker images -f "dangling=true" -q | wc -l
    
    echo "Containers that will be removed:"
    docker ps -a -f "status=exited" -q | wc -l
    
    read -p "Continue with cleanup? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker system prune -a -f
        echo -e "${GREEN}✓${NC} Cleanup complete"
    fi
}

view_resources() {
    echo -e "${BLUE}Container Resource Usage:${NC}"
    docker stats --no-stream
    echo ""
    echo -e "${BLUE}System Memory:${NC}"
    free -h
    echo ""
    echo -e "${BLUE}System Disk:${NC}"
    df -h /
}

run_migrations() {
    echo -e "${YELLOW}Running database migrations...${NC}"
    docker compose -f $COMPOSE_FILE exec backend npm run db:migrate
    echo -e "${GREEN}✓${NC} Migrations complete"
}

seed_database() {
    read -p "Are you sure you want to seed the database? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Seeding database...${NC}"
        docker compose -f $COMPOSE_FILE exec backend npm run db:seed
        echo -e "${GREEN}✓${NC} Database seeded"
    fi
}

pull_ai_models() {
    echo -e "${YELLOW}Pulling AI models...${NC}"
    echo "This may take several minutes..."
    docker compose -f $COMPOSE_FILE exec ollama ollama pull qwen2.5:1.5b-instruct
    echo -e "${GREEN}✓${NC} AI models downloaded"
    
    echo ""
    echo "Available models:"
    docker compose -f $COMPOSE_FILE exec ollama ollama list
}

check_health() {
    if [ -f ./health-check.sh ]; then
        bash ./health-check.sh
    else
        echo -e "${RED}✗${NC} health-check.sh not found!"
    fi
}

view_disk_usage() {
    echo -e "${BLUE}Disk Usage by Component:${NC}"
    echo ""
    echo "Docker volumes:"
    docker system df -v | grep -A 20 "Local Volumes"
    echo ""
    echo "Application directory:"
    du -sh ~/myjudicial-backend
    echo ""
    echo "Backups:"
    du -sh ~/backups 2>/dev/null || echo "No backups directory"
    echo ""
    echo "Docker system:"
    docker system df
}

rotate_logs() {
    echo -e "${YELLOW}Rotating logs...${NC}"
    
    # Rotate Docker container logs
    sudo find /var/lib/docker/containers -name "*.log" -mtime +7 -delete
    
    # Rotate application logs
    if [ -d ./logs ]; then
        find ./logs -name "*.log" -mtime +7 -delete
    fi
    
    echo -e "${GREEN}✓${NC} Old logs removed (older than 7 days)"
}

# Main loop
while true; do
    show_menu
    case $choice in
        1) view_status ;;
        2) view_all_logs ;;
        3) view_service_logs ;;
        4) restart_all ;;
        5) restart_service ;;
        6) stop_all ;;
        7) start_all ;;
        8) update_rebuild ;;
        9) backup_database ;;
        10) restore_database ;;
        11) cleanup_docker ;;
        12) view_resources ;;
        13) run_migrations ;;
        14) seed_database ;;
        15) pull_ai_models ;;
        16) check_health ;;
        17) view_disk_usage ;;
        18) rotate_logs ;;
        0) echo "Goodbye!"; exit 0 ;;
        *) echo -e "${RED}Invalid choice${NC}" ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
done
