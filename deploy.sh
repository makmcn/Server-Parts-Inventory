#!/bin/bash
set -e

# ─── Настройки ───────────────────────────────────────────────
DB_USER="warehouse_user"
DB_PASS="warehouse_pass"
DB_NAME="warehouse"
APP_PORT=5000
APP_DIR="$HOME/Server-Parts-Inventory"
REPO="git@github.com:makmcn/Server-Parts-Inventory.git"
# ─────────────────────────────────────────────────────────────

echo "==> [1/9] Проверка зависимостей..."
node --version | grep -qE 'v(2[0-9]|[3-9][0-9])' || { echo "Нужен Node.js 20+"; exit 1; }
command -v pnpm  >/dev/null || { echo "Нужен pnpm: npm i -g pnpm"; exit 1; }
command -v nginx >/dev/null || sudo apt install -y nginx
pg_isready >/dev/null       || { echo "PostgreSQL не запущен"; exit 1; }

echo "==> [2/9] Создание БД и пользователя..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
sudo -u postgres psql -d $DB_NAME -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;" 2>/dev/null || true
sudo -u postgres psql -d $DB_NAME -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;" 2>/dev/null || true

echo "==> [3/9] Клонирование репозитория..."
if [ -d "$APP_DIR" ]; then
  echo "    Папка уже есть, делаем git pull..."
  cd "$APP_DIR" && git pull
else
  git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "==> [4/9] Создание .env..."
cat > "$APP_DIR/.env" <<EOF
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME
PORT=$APP_PORT
BASE_PATH=/
EOF

echo "==> [5/9] Установка зависимостей..."
cd "$APP_DIR"
pnpm install

echo "==> [6/9] Сборка фронтенда..."
PORT=$APP_PORT BASE_PATH=/ pnpm --filter @workspace/warehouse run build

echo "==> [7/9] Сборка бэкенда..."
pnpm --filter @workspace/api-server run build

echo "==> [8/9] Применение схемы БД..."
sudo -u postgres psql -d $DB_NAME -c "
DO \$\$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' OWNER TO $DB_USER';
  END LOOP;
END\$\$;" 2>/dev/null || true

DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME \
  pnpm --filter @workspace/db run push

echo "==> [9/9] Настройка nginx и systemd..."

# systemd unit
sudo tee /etc/systemd/system/warehouse.service >/dev/null <<EOF
[Unit]
Description=Warehouse API Server
After=network.target postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
Environment=DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME
Environment=PORT=$APP_PORT
ExecStart=/usr/bin/node $APP_DIR/artifacts/api-server/dist/index.mjs
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable warehouse
sudo systemctl restart warehouse

# nginx конфиг
sudo tee /etc/nginx/sites-available/warehouse >/dev/null <<EOF
server {
    listen 80;
    server_name localhost;

    root $APP_DIR/artifacts/warehouse/dist/public;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/warehouse /etc/nginx/sites-enabled/warehouse
sudo nginx -t
sudo service nginx restart

echo ""
echo "✅ Готово! Открывай http://localhost"
