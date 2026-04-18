# ===============================================
# Stage 1: Build Backend (Go)
# ===============================================
FROM golang:1.26-alpine AS builder-backend

WORKDIR /build/backend

RUN apk add --no-cache git make

COPY core/go.mod core/go.sum ./
RUN go mod download

COPY core/ .

RUN CGO_ENABLED=1 GOOS=linux go build -o asagity-server .

# ===============================================
# Stage 2: Build Frontend (Node.js/Nuxt)
# ===============================================
FROM node:22-alpine AS builder-frontend

WORKDIR /build/frontend

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY web/package.json web/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY web/ ./
RUN pnpm build

# ===============================================
# Stage 3: Production Runtime
# ===============================================
FROM alpine:3.21 AS runtime

RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    bash \
    curl \
    nginx

RUN mkdir -p /app/backend /app/frontend /app/storage

COPY --from=builder-backend /build/backend/asagity-server /app/backend/asagity-server
COPY core/.env.example /app/backend/.env.example

COPY --from=builder-frontend /build/frontend/.output /app/frontend/.output
COPY --from=builder-frontend /build/frontend/public /app/frontend/public

RUN mkdir -p /etc/nginx/http.d /etc/nginx/ssl

RUN cat > /etc/nginx/http.d/default.conf << 'EOF'
server {
    listen 2000;
    server_name _;
    root /app/frontend;
    index index.html;
    charset utf-8;
    client_max_body_size 100M;
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;
    
    # Frontend static files
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy to backend
    location /api/ {
        proxy_pass http://127.0.0.1:2048/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /healthz {
        proxy_pass http://127.0.0.1:2048/healthz;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
EOF

RUN cat > /app/start.sh << 'EOF'
#!/bin/bash
set -e

cd /app/backend

if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

./asagity-server &
BACKEND_PID=$!

echo "Waiting for backend to be ready..."
for i in $(seq 1 30); do
    if curl -sf http://localhost:2048/healthz > /dev/null 2>&1; then
        echo "Backend is ready"
        break
    fi
    sleep 1
done

# Start Nginx on port 2000 (frontend)
nginx -g "daemon off;"
EOF
chmod +x /app/start.sh

WORKDIR /app
ENV PATH="/app/backend:${PATH}" \
    HOME=/app \
    TZ=Asia/Shanghai

EXPOSE 2000 2048

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -sf http://localhost:2048/healthz || exit 1

CMD ["/app/start.sh"]