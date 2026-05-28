#!/usr/bin/env bash
# One-time VPS provisioning: swap, firewall, fail2ban, Docker.
# Idempotent — safe to re-run. Run as a sudo-capable non-root user.
#
#   bash scripts/vps-setup.sh
#
set -euo pipefail

SWAP_SIZE="${SWAP_SIZE:-4G}"

log() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }

if [ "$(id -u)" -eq 0 ]; then
  echo "Run as a regular sudo user, not root." >&2
  exit 1
fi

# --- Swap (prevents OOM during next build) --------------------------------
if swapon --show | grep -q '/swapfile'; then
  log "Swap already active, skipping"
else
  log "Creating ${SWAP_SIZE} swap file"
  sudo fallocate -l "$SWAP_SIZE" /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  if ! grep -q '/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
  fi
fi

# --- Firewall -------------------------------------------------------------
log "Configuring firewall (SSH, HTTP, HTTPS)"
sudo apt-get update -y
sudo apt-get install -y ufw fail2ban
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# --- fail2ban (SSH brute-force protection) --------------------------------
log "Enabling fail2ban"
sudo systemctl enable --now fail2ban

# --- Docker ---------------------------------------------------------------
if command -v docker >/dev/null 2>&1; then
  log "Docker already installed, skipping"
else
  log "Installing Docker"
  curl -fsSL https://get.docker.com | sh
fi

if ! groups "$USER" | grep -q '\bdocker\b'; then
  log "Adding $USER to the docker group"
  sudo usermod -aG docker "$USER"
  echo
  echo "NOTE: log out and back in (or run 'newgrp docker') for docker access to take effect."
fi

log "VPS setup complete"
echo "Next: cp .env.production.example .env.production && nano .env.production"
echo "Then: bash scripts/deploy.sh"
