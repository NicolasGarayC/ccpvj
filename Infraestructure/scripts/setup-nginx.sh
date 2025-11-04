#!/bin/bash
# ====================================================================
# Script de Instalación de Configuración Nginx
# ====================================================================
# Copia la configuración de Nginx del proyecto al sistema

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
NGINX_CONF="$PROJECT_DIR/Infraestructure/nginx/sites-available/centro-cultural.conf"

echo -e "${GREEN}=====================================================================${NC}"
echo -e "${GREEN}  Instalación de Configuración Nginx${NC}"
echo -e "${GREEN}=====================================================================${NC}"

# Verificar que el archivo de configuración existe
if [ ! -f "$NGINX_CONF" ]; then
    echo -e "${RED}ERROR: No se encontró el archivo de configuración en:${NC}"
    echo "$NGINX_CONF"
    exit 1
fi

echo -e "\n${YELLOW}[1/4] Copiando configuración a sites-available...${NC}"
sudo cp "$NGINX_CONF" /etc/nginx/sites-available/centro-cultural

echo -e "${YELLOW}[2/4] Creando symlink en sites-enabled...${NC}"
sudo ln -sf /etc/nginx/sites-available/centro-cultural /etc/nginx/sites-enabled/centro-cultural

echo -e "${YELLOW}[3/4] Verificando configuración de Nginx...${NC}"
sudo nginx -t

echo -e "${YELLOW}[4/4] Recargando Nginx...${NC}"
sudo systemctl reload nginx || sudo systemctl start nginx

echo -e "\n${GREEN}✓ Configuración de Nginx instalada correctamente${NC}"
echo -e "${GREEN}=====================================================================${NC}"
