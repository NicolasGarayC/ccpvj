#!/bin/bash
# ====================================================================
# Script de Configuración de Base de Datos
# ====================================================================
# Configura el symlink de la base de datos SQLite

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
DB_SOURCE="$PROJECT_DIR/Data/ccpvj.db"
DB_LINK="/tmp/ccpvj.db"

echo -e "${GREEN}=====================================================================${NC}"
echo -e "${GREEN}  Configuración de Base de Datos${NC}"
echo -e "${GREEN}=====================================================================${NC}"

# Verificar que la base de datos fuente existe
if [ ! -f "$DB_SOURCE" ]; then
    echo -e "${RED}ERROR: No se encontró la base de datos en:${NC}"
    echo "$DB_SOURCE"
    exit 1
fi

echo -e "\n${YELLOW}[1/2] Verificando base de datos...${NC}"
echo "Ubicación: $DB_SOURCE"
echo "Tamaño: $(ls -lh "$DB_SOURCE" | awk '{print $5}')"

# Eliminar symlink existente si lo hay
if [ -L "$DB_LINK" ]; then
    echo -e "\n${YELLOW}[2/2] Eliminando symlink existente...${NC}"
    rm -f "$DB_LINK"
elif [ -f "$DB_LINK" ]; then
    echo -e "\n${YELLOW}[2/2] Eliminando archivo existente en /tmp...${NC}"
    rm -f "$DB_LINK"
fi

echo -e "${YELLOW}Creando symlink a la base de datos...${NC}"
ln -s "$DB_SOURCE" "$DB_LINK"

echo -e "\n${GREEN}✓ Base de datos configurada correctamente${NC}"
echo -e "  Source: $DB_SOURCE"
echo -e "  Link:   $DB_LINK"
echo -e "${GREEN}=====================================================================${NC}"
