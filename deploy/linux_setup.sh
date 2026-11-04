#!/usr/bin/env bash
# ==============================================================================
# NetPulse Core Suite - Automated Headless Linux Server Installer & Systemd Setup
# Targets: Ubuntu / Debian / CentOS / RHEL / Fedora / Arch Linux
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}==========================================================${NC}"
echo -e "${CYAN}   ⚡ NetPulse Headless Linux Server Production Setup     ${NC}"
echo -e "${CYAN}==========================================================${NC}"

# Check for root / sudo privileges
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}Error: This script must be run as root or with sudo.${NC}" 
   exit 1
fi

INSTALL_DIR="/opt/netpulse"
DATA_DIR="/var/lib/netpulse"
SERVICE_NAME="netpulse"
PORT="8000"

echo -e "${BLUE}[1/7] Detecting Linux distribution and installing prerequisites...${NC}"
if command -v apt-get &>/dev/null; then
    apt-get update -qq
    apt-get install -y -qq python3 python3-pip python3-venv git curl lsof iptables
elif command -v dnf &>/dev/null; then
    dnf install -y python3 python3-pip python3-virtualenv git curl lsof iptables
elif command -v pacman &>/dev/null; then
    pacman -Sy --noconfirm python python-pip git curl lsof iptables
else
    echo "Warning: Unrecognized package manager. Assuming Python 3 and venv are installed."
fi

echo -e "${BLUE}[2/7] Creating system service account 'netpulse'...${NC}"
if ! id -u netpulse &>/dev/null; then
    useradd --system --shell /bin/false --comment "NetPulse Daemon" --user-group netpulse
fi

echo -e "${BLUE}[3/7] Setting up application directories...${NC}"
mkdir -p "$INSTALL_DIR" "$DATA_DIR" "$DATA_DIR/media"
chown -R netpulse:netpulse "$INSTALL_DIR" "$DATA_DIR"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo -e "${BLUE}[4/7] Synchronizing application files from ${SCRIPT_DIR}...${NC}"
cp -r "$SCRIPT_DIR/backend" "$INSTALL_DIR/"
cp -r "$SCRIPT_DIR/frontend" "$INSTALL_DIR/"

echo -e "${BLUE}[5/7] Provisioning Python virtual environment and ASGI dependencies...${NC}"
python3 -m venv "$INSTALL_DIR/backend/venv"
"$INSTALL_DIR/backend/venv/bin/pip" install --upgrade pip -q
"$INSTALL_DIR/backend/venv/bin/pip" install -r "$INSTALL_DIR/backend/requirements.txt" -q

echo -e "${BLUE}[6/7] Running database migrations...${NC}"
export NETPULSE_DATA_DIR="$DATA_DIR"
"$INSTALL_DIR/backend/venv/bin/python" "$INSTALL_DIR/backend/manage.py" migrate --noinput
chown -R netpulse:netpulse "$DATA_DIR"

echo -e "${BLUE}[7/7] Installing and starting systemd service...${NC}"
cat <<EOF > /etc/systemd/system/${SERVICE_NAME}.service
[Unit]
Description=NetPulse Core Suite ASGI Daemon
After=network.target network-online.target
Wants=network-online.target

[Service]
Type=simple
User=netpulse
Group=netpulse
WorkingDirectory=${INSTALL_DIR}/backend
Environment="PYTHONPATH=${INSTALL_DIR}/backend"
Environment="DJANGO_SETTINGS_MODULE=config.settings"
Environment="PYTHONUNBUFFERED=1"
Environment="NETPULSE_DATA_DIR=${DATA_DIR}"
ExecStart=${INSTALL_DIR}/backend/venv/bin/daphne -b 0.0.0.0 -p ${PORT} config.asgi:application
Restart=always
RestartSec=5s
LimitNOFILE=65535

# Security sandbox
ProtectSystem=full
ProtectHome=true
NoNewPrivileges=false

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ${SERVICE_NAME}
systemctl restart ${SERVICE_NAME}

# Detect local IP
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")

echo -e "${GREEN}==========================================================${NC}"
echo -e "${GREEN}  ✅ NetPulse Server Installation Successful!            ${NC}"
echo -e "${GREEN}==========================================================${NC}"
echo -e "  • Dashboard Web UI: http://${SERVER_IP}:${PORT}/"
echo -e "  • API Health Check: http://${SERVER_IP}:${PORT}/api/health/"
echo -e "  • Service Status:   systemctl status ${SERVICE_NAME}"
echo -e "  • View Logs:        journalctl -u ${SERVICE_NAME} -f"
echo -e "${GREEN}==========================================================${NC}"
