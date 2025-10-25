#!/bin/bash

# ====================================================================
# Script de Inicio Automático - Centro Cultural Víctor Jara
# ====================================================================
# Autor: Sistema de Despliegue Automático
# Fecha: Octubre 2025
# Descripción: Compila e inicia frontend y backend automáticamente
# ====================================================================

set -e  # Detener en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directorio base del proyecto (auto-detectado desde la ubicación del script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${PROJECT_DIR_OVERRIDE:-$SCRIPT_DIR}"
BACKEND_DIR="$PROJECT_DIR/Back"
FRONTEND_DIR="$PROJECT_DIR/Front"
ENV_FILE="$FRONTEND_DIR/.env.production"

# Cargar variables de entorno del frontend si el archivo existe
if [ -f "$ENV_FILE" ]; then
    set -a
    # shellcheck disable=SC1090
    . "$ENV_FILE"
    set +a
fi

if [ -z "${PUBLIC_BACKEND_BASE_URL:-}" ]; then
    echo -e "${RED}ERROR: PUBLIC_BACKEND_BASE_URL no está definido.${NC}"
    echo "Configura la variable en $ENV_FILE o expórtala antes de ejecutar este script."
    exit 1
fi

# Normalizar URL del backend público (sin barras finales)
PUBLIC_BACKEND_BASE_URL="$(printf '%s' "$PUBLIC_BACKEND_BASE_URL" | sed 's:/*$::')"

# Configurar directorio de medios si no está definido
if [ -z "${MEDIA_DIR:-}" ]; then
    export MEDIA_DIR="$BACKEND_DIR/Data/media"
fi

# Configuración de variables de entorno por defecto
export PUBLIC_BACKEND_BASE_URL
export MEDIA_DIR

echo -e "${GREEN}=====================================================================${NC}"
echo -e "${GREEN}  Centro Cultural Víctor Jara - Inicio Automático${NC}"
echo -e "${GREEN}=====================================================================${NC}"

# Función para verificar si PM2 está instalado
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        echo -e "${RED}ERROR: PM2 no está instalado${NC}"
        echo "Instalar con: sudo npm install -g pm2"
        exit 1
    fi
}

# Función para compilar backend
build_backend() {
    echo -e "\n${YELLOW}[1/4] Compilando Backend (.NET)...${NC}"
    cd "$BACKEND_DIR"
    dotnet build --configuration Release > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Backend compilado correctamente${NC}"
    else
        echo -e "${RED}✗ Error al compilar backend${NC}"
        exit 1
    fi
}

# Función para compilar frontend
build_frontend() {
    echo -e "\n${YELLOW}[2/4] Compilando Frontend (SvelteKit)...${NC}"
    cd "$FRONTEND_DIR"

    echo "  - Instalando dependencias npm..."
    if npm install --no-audit --no-fund > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓ Dependencias actualizadas${NC}"
    else
        echo -e "${RED}✗ Error al instalar dependencias npm${NC}"
        exit 1
    fi

    if npm run build > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend compilado correctamente${NC}"
    else
        echo -e "${RED}✗ Error al compilar frontend${NC}"
        exit 1
    fi
}

# Función para iniciar servicios con PM2
start_services() {
    echo -e "\n${YELLOW}[3/4] Iniciando servicios...${NC}"

    # Detener procesos existentes si están corriendo
    pm2 delete centro-cultural-backend 2>/dev/null || true
    pm2 delete centro-cultural-frontend 2>/dev/null || true

    # Iniciar backend
    cd "$BACKEND_DIR"
    ASPNETCORE_URLS="http://localhost:5251" pm2 start "dotnet bin/Release/net8.0/Back.dll" --name centro-cultural-backend > /dev/null 2>&1

    # Iniciar frontend con variables de entorno
    cd "$FRONTEND_DIR"
    MEDIA_DIR="$MEDIA_DIR" pm2 start build/index.js --name centro-cultural-frontend > /dev/null 2>&1

    echo -e "${GREEN}✓ Servicios iniciados correctamente${NC}"
}

# Función para guardar configuración PM2
save_pm2_config() {
    echo -e "\n${YELLOW}[4/4] Guardando configuración PM2...${NC}"
    pm2 save > /dev/null 2>&1
    echo -e "${GREEN}✓ Configuración guardada${NC}"
}

# Función para mostrar estado final
show_status() {
    echo -e "\n${GREEN}=====================================================================${NC}"
    echo -e "${GREEN}  Estado de la Aplicación${NC}"
    echo -e "${GREEN}=====================================================================${NC}\n"
    pm2 status
    echo -e "\n${GREEN}Aplicación disponible en:${NC}"
    echo -e "  - http://localhost"
    echo -e "  - http://192.168.68.101"
    echo -e "\n${YELLOW}Directorio de medios:${NC}"
    echo -e "  $MEDIA_DIR"
    echo -e "\n${YELLOW}Comandos útiles:${NC}"
    echo -e "  pm2 logs                    - Ver logs de todas las aplicaciones"
    echo -e "  pm2 restart all             - Reiniciar todas las aplicaciones"
    echo -e "  pm2 stop all                - Detener todas las aplicaciones"
    echo -e "\n${GREEN}=====================================================================${NC}"
}

# ====================================================================
# EJECUCIÓN PRINCIPAL
# ====================================================================

# Verificar PM2
check_pm2

# Compilar y desplegar
build_backend
build_frontend
start_services
save_pm2_config
show_status

exit 0
