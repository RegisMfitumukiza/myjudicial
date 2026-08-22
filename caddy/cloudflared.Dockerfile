# ============================================
# Cloudflare Tunnel (cloudflared)
# ============================================
# Built locally due to Docker Hub being unreachable.
# Downloads cloudflared binary from GitHub releases.
# TARGETARCH is auto-set by BuildKit (arm64 on the OCI VPS, amd64 elsewhere).
# ============================================
FROM alpine:latest

ARG TARGETARCH=arm64

RUN apk add --no-cache curl ca-certificates && \
    curl -sL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${TARGETARCH}" \
      -o /usr/local/bin/cloudflared && \
    chmod +x /usr/local/bin/cloudflared && \
    rm -rf /var/cache/apk/*

ENTRYPOINT ["/usr/local/bin/cloudflared"]
