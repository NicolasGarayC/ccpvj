#!/bin/bash
# ====================================================================
# Script de Deployment Completo - Centro Cultural Víctor Jara
# ====================================================================
# Realiza el deployment completo de frontend y backend

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOY_TARGET="${DEPLOY_TARGET:-/var/www/centro-cultural}"

echo -e "${GREEN}=====================================================================${NC}"
echo -e "${GREEN}  Centro Cultural Víctor Jara - Deployment${NC}"
echo -e "${GREEN}=====================================================================${NC}"

# Verificar que estamos en el proyecto correcto
if [ ! -f "$PROJECT_DIR/Back.sln" ]; then
    echo -e "${RED}ERROR: No se encontró Back.sln. ¿Estás en el directorio correcto?${NC}"
    exit 1
fi

# Paso 1: Actualizar código
echo -e "\n${YELLOW}[1/7] Actualizando código desde Git...${NC}"
cd "$PROJECT_DIR"
git fetch origin
git pull origin desarrollo

# Paso 2: Compilar Backend
echo -e "\n${YELLOW}[2/7] Compilando Backend (.NET)...${NC}"
cd "$PROJECT_DIR/Back"
dotnet build --configuration Release --no-incremental

# Paso 3: Compilar Frontend
echo -e "\n${YELLOW}[3/7] Compilando Frontend (SvelteKit)...${NC}"
cd "$PROJECT_DIR/Front"
npm install
npm run build

# Paso 4: Copiar archivos a directorio de producción
echo -e "\n${YELLOW}[4/7] Sincronizando archivos a $DEPLOY_TARGET...${NC}"
if [ "$PROJECT_DIR" != "$DEPLOY_TARGET" ]; then
    sudo rsync -av --delete \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='Front/.svelte-kit' \
        --exclude='Back/obj' \
        --exclude='Back/bin/Debug' \
        "$PROJECT_DIR/" "$DEPLOY_TARGET/"
    echo "Archivos sincronizados a $DEPLOY_TARGET"
else
    echo "Ya estamos en el directorio de producción, saltando sincronización."
fi

# Paso 5: Configurar base de datos
echo -e "\n${YELLOW}[5/7] Configurando base de datos...${NC}"
bash "$PROJECT_DIR/Infraestructure/scripts/setup-database.sh"

# Paso 6: Reiniciar servicios PM2
echo -e "\n${YELLOW}[6/7] Reiniciando servicios PM2...${NC}"
pm2 restart centro-cultural-backend || pm2 start "$PROJECT_DIR/Infraestructure/pm2/ecosystem.config.js" --only centro-cultural-backend
pm2 restart centro-cultural-frontend || pm2 start "$PROJECT_DIR/Infraestructure/pm2/ecosystem.config.js" --only centro-cultural-frontend

# Esperar a que los servicios inicien
sleep 5

# Paso 7: Verificar estado
echo -e "\n${YELLOW}[7/7] Verificando estado de servicios...${NC}"
pm2 status

echo -e "\n${GREEN}=====================================================================${NC}"
echo -e "${GREEN}✓ Deployment completado exitosamente${NC}"
echo -e "${GREEN}=====================================================================${NC}"
echo -e "\n${YELLOW}Información de servicios:${NC}"
echo -e "  Frontend: http://localhost:3000"
echo -e "  Backend:  http://localhost:5251"
echo -e "  Nginx:    http://localhost:80"
echo -e "\n${YELLOW}Comandos útiles:${NC}"
echo -e "  pm2 logs centro-cultural-frontend"
echo -e "  pm2 logs centro-cultural-backend"
echo -e "  pm2 restart all"
