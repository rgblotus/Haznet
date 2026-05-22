# 1. Create project directory
mkdir neo-stack && cd neo-stack

# 2. Copy template and customize
cp .env.example .env
nano .env  # 🔐 Update passwords & emails

# 3. Create external network (if not exists)
docker network create ${NETWORK_NAME:-neo-network}

# 4. Start services
docker compose up -d

# 5. Verify
docker compose ps
docker compose logs -f postgres  # Watch for "database system is ready"

# 6. Access pgAdmin
# → http://localhost:5050
# → Login with credentials from .env

# 7. (Optional) Connect via psql locally
psql -h localhost -U neo_user -d neodb

#8 Delete Everything
docker compose down -v
docker system prune -a -f
docker volume prune -f
docker compose up -d