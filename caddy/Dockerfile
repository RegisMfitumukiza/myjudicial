# ============================================
# Caddy Reverse Proxy (custom build)
# Uses pre-downloaded Caddy binary since Docker Hub is unreachable
# ============================================
FROM node:20-slim AS base

# Install CA certificates (required for Caddy's ACME/Let's Encrypt)
RUN sed -i 's|http://deb.debian.org|http://mirrors.aliyun.com|g' /etc/apt/sources.list.d/debian.sources && \
    apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy the pre-downloaded Caddy binary
COPY caddy /usr/local/bin/caddy
RUN chmod +x /usr/local/bin/caddy && \
    caddy version

# Copy Caddyfile
COPY Caddyfile /etc/caddy/Caddyfile

# Caddy runs as root (needed for binding to ports 80/443 and writing to /data, /config)
EXPOSE 80 443

# Caddy will use /data for TLS certificates and /config for internal state
VOLUME /data /config

ENTRYPOINT ["/usr/local/bin/caddy"]
CMD ["run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
