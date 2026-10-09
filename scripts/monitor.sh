#!/usr/bin/env bash
# ============================================================================
# myjudicial VPS health probe
#
# Run ON the VPS from the repository root (the dir that owns docker-compose.yml).
# Used by .github/workflows/monitoring.yml (streamed over stdin: `... bash -s`)
# and can be run by hand:  cd /path/to/app && bash scripts/monitor.sh
#
# Output: one line per check prefixed OK/WARN/CRIT, plus a summary footer.
# Exit:   0 = all OK (WARN tolerated), 1 = at least one CRIT.
# WARN marks things heading towards trouble; CRIT is actionable degradation.
# ============================================================================
set -u

ncrit=0
nwarn=0

ok()   { printf 'OK   %s\n' "$*"; }
warn() { printf 'WARN %s\n' "$*"; nwarn=1; }
crit() { printf 'CRIT %s\n' "$*"; ncrit=1; }

probe_ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "== myjudicial VPS probe @ $probe_ts (cwd: $(pwd)) =="

# --- Docker daemon ---------------------------------------------------------
if docker info >/dev/null 2>&1; then
  ok "docker daemon responding (docker info)"
else
  crit "docker daemon unreachable"
fi

# --- Services (topology from docker-compose.yml) ---------------------------
# backend/ai declare healthchecks; frontend/cloudflared come up without one.
for svc in backend frontend ai cloudflared; do
  cid="$(docker compose ps -aq "$svc" 2>/dev/null | head -n1)"
  if [ -z "$cid" ]; then
    crit "service $svc has no container (compose down/never started?)"
    continue
  fi
  state="$(docker inspect -f '{{.State.Status}}' "$cid" 2>/dev/null)"
  health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$cid" 2>/dev/null)"
  restarts="$(docker inspect -f '{{.RestartCount}}' "$cid" 2>/dev/null)"
  if [ "$state" = "running" ]; then
    case "$svc" in
      backend|ai)
        if [ "$health" = "healthy" ]; then
          ok "service $svc running + healthy (restarts=$restarts)"
        elif [ "$health" = "starting" ]; then
          warn "service $svc still starting (health=$health restarts=$restarts)"
        else
          crit "service $svc running but health=$health (restarts=$restarts)"
        fi
        ;;
      *)
        ok "service $svc running (restarts=$restarts)"
        ;;
    esac
  else
    crit "service $svc state=$state (health=$health restarts=$restarts)"
  fi
  if [ "${restarts:-0}" -ge 3 ]; then
    warn "service $svc restart count ${restarts} >= 3 since creation (crash loop?)"
  fi
done

# --- In-container health (internal, bypasses tunnel) -----------------------
# backend /health does a real `SELECT 1` so this also exercises the DB path.
if docker compose exec -T backend node -e "fetch('http://localhost:4000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1; then
  ok "backend internal /health (incl. DB SELECT 1)"
else
  crit "backend internal /health failed (DB path?)"
fi

if docker compose exec -T ai curl -fsS --max-time 15 http://localhost:5000/health >/dev/null 2>&1; then
  ok "ai internal /health"
else
  crit "ai internal /health failed"
fi

# --- Public ingress via Cloudflare tunnel (end-to-end) ---------------------
env_file="$(pwd)/.env"
frontend_url="$(grep -E '^FRONTEND_URL=' "$env_file" 2>/dev/null | tail -n1 | cut -d= -f2- | tr -d '"' | tr -d '\r' | sed 's/[[:space:]]*$//')"
backend_url="$(grep -E '^BACKEND_URL=' "$env_file" 2>/dev/null | tail -n1 | cut -d= -f2- | tr -d '"' | tr -d '\r' | sed 's/[[:space:]]*$//')"
[ -z "$frontend_url" ] && frontend_url="https://myjudicial.com"
[ -z "$backend_url" ] && backend_url="https://api.myjudicial.com"

fwcode="$(curl -fsSL -o /dev/null -w '%{http_code}' --max-time 25 --max-redirs 5 "$frontend_url/" 2>/dev/null)"
if [ "$fwcode" = "200" ]; then
  ok "public frontend $frontend_url -> $fwcode"
else
  crit "public frontend $frontend_url unreachable (code=${fwcode:-none})"
fi

bwcode="$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 25 "$backend_url/health" 2>/dev/null)"
if [ "$bwcode" = "200" ]; then
  ok "public api /health $backend_url -> $bwcode"
else
  crit "public api /health $backend_url failed (code=${bwcode:-none})"
fi

# --- Host capacity ----------------------------------------------------------
used_devs=""
check_mount() {
  local m="$1"
  local pct dev out
  out="$(df -P "$m" 2>/dev/null | awk 'NR==2 {print $1" "$5}')"
  [ -n "$out" ] || { warn "disk usage for $m unreadable"; return; }
  dev="$(printf '%s\n' "$out" | cut -d' ' -f1)"
  pct="$(printf '%s\n' "$out" | cut -d' ' -f2 | tr -d '%')"
  case " $used_devs " in
    *" $dev "*) return ;; # same filesystem as an earlier mount
  esac
  used_devs="$used_devs $dev"
  if [ "$pct" -ge 95 ]; then
    crit "disk $m ${pct}% used (>=95) dev=$dev"
  elif [ "$pct" -ge 85 ]; then
    warn "disk $m ${pct}% used (>=85) dev=$dev"
  else
    ok "disk $m ${pct}% used dev=$dev"
  fi
}
check_mount "/"
check_mount "/var/lib/docker"

mem_total="$(free -m 2>/dev/null | awk 'NR==2 {print $2}')"
mem_avail="$(free -m 2>/dev/null | awk 'NR==2 {print $7}')"
if [ -n "$mem_avail" ]; then
  if [ "$mem_avail" -lt 200 ]; then
    crit "memory available ${mem_avail}MiB / ${mem_total}MiB (<200)"
  elif [ "$mem_avail" -lt 400 ]; then
    warn "memory available ${mem_avail}MiB / ${mem_total}MiB (<400)"
  else
    ok "memory available ${mem_avail}MiB / ${mem_total}MiB"
  fi
else
  warn "memory info unreadable"
fi

load1="$(awk '{print $1}' /proc/loadavg 2>/dev/null)"
cores="$(nproc)"
exp_limit=$(( cores > 0 ? cores * 2 : 8 ))
load_int="${load1%%.*}"
[ -z "$load_int" ] && load_int=0
if [ "$load1" = "0" ]; then load1="0"; fi
if [ "$load_int" -ge "$exp_limit" ]; then
  warn "load1 ${load1} on ${cores} cores (>=2x cores)"
else
  ok "load1 ${load1} on ${cores} cores"
fi

# --- Summary ---------------------------------------------------------------
echo ""
echo "== $probe_ts result: $ncrit CRIT, $nwarn WARN =="
echo "== BACKEND_LOGS_BEGIN =="
docker compose logs --tail 60 backend 2>/dev/null || true
echo "== BACKEND_LOGS_END =="
if [ "$ncrit" -gt 0 ]; then
  exit 1
fi
exit 0