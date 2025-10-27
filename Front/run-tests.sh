#!/bin/bash

# Script de ayuda para ejecutar tests del proyecto
# Centro Cultural Víctor Jara

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Centro Cultural Víctor Jara - Test Runner${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Función para mostrar menú
show_menu() {
    echo -e "${GREEN}Selecciona qué tests ejecutar:${NC}"
    echo ""
    echo "  ${YELLOW}TESTS UNITARIOS${NC}"
    echo "  1) Todos los tests unitarios"
    echo "  2) Tests de Material de Apoyo"
    echo "  3) Tests de Blog"
    echo "  4) Tests de Calendar"
    echo "  5) Tests de Auth/JWT"
    echo ""
    echo "  ${YELLOW}TESTS DE COMPONENTES${NC}"
    echo "  6) Tests de MaterialApoyoCard"
    echo "  7) Tests de ModuleCard"
    echo "  8) Tests de MaterialApoyoForm"
    echo ""
    echo "  ${YELLOW}TESTS E2E${NC}"
    echo "  9) Todos los tests E2E"
    echo " 10) Tests E2E de Material de Apoyo (hierarchy)"
    echo " 11) Tests E2E de Material de Apoyo (authorization)"
    echo " 12) Tests E2E de Blog"
    echo ""
    echo "  ${YELLOW}OTROS${NC}"
    echo " 13) Ejecutar todos los tests (unit + E2E)"
    echo " 14) Tests con cobertura"
    echo " 15) Tests en modo watch"
    echo " 16) Salir"
    echo ""
    echo -n "Opción: "
}

# Función para ejecutar comando
run_command() {
    echo ""
    echo -e "${BLUE}Ejecutando:${NC} $1"
    echo -e "${BLUE}================================================${NC}"
    eval $1
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✓ Tests completados exitosamente${NC}"
    else
        echo ""
        echo -e "${RED}✗ Algunos tests fallaron${NC}"
    fi
}

# Loop principal
while true; do
    show_menu
    read -r option

    case $option in
        1)
            run_command "npm run test:unit"
            ;;
        2)
            run_command "npm run test:unit -- materialApoyoService.test.ts"
            ;;
        3)
            run_command "npm run test:unit -- blogService.test.ts"
            ;;
        4)
            run_command "npm run test:unit -- calendarService.test.ts"
            ;;
        5)
            run_command "npm run test:unit -- jwtService.test.ts"
            ;;
        6)
            run_command "npm run test:unit -- MaterialApoyoCard.test.ts"
            ;;
        7)
            run_command "npm run test:unit -- ModuleCard.test.ts"
            ;;
        8)
            run_command "npm run test:unit -- MaterialApoyoForm.test.ts"
            ;;
        9)
            run_command "npm run test:e2e"
            ;;
        10)
            run_command "npm run test:e2e -- material-apoyo/hierarchy.spec.ts"
            ;;
        11)
            run_command "npm run test:e2e -- material-apoyo/authorization.spec.ts"
            ;;
        12)
            run_command "npm run test:e2e -- blog/blog-crud.spec.ts"
            ;;
        13)
            echo -e "${YELLOW}Ejecutando todos los tests...${NC}"
            run_command "npm run test:unit"
            run_command "npm run test:e2e"
            ;;
        14)
            run_command "npm run test:unit -- --coverage"
            ;;
        15)
            echo -e "${YELLOW}Iniciando modo watch...${NC}"
            echo -e "${YELLOW}Presiona Ctrl+C para salir${NC}"
            npm run test:unit -- --watch
            ;;
        16)
            echo -e "${GREEN}¡Hasta luego!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Opción inválida${NC}"
            ;;
    esac

    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo ""
    read -p "Presiona Enter para continuar..."
    clear
done
