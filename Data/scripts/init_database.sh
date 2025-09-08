#!/bin/bash

# =====================================================
# CENTRO CULTURAL VÍCTOR JARA - Database Initialization Script
# =====================================================

set -e  # Exit on any error

# Configuration
DB_PATH="/home/user/ccpvj/Data/ccpvj.db"
SQL_FILE="/home/user/ccpvj/database_tables.sql"
BACKUP_DIR="/home/user/ccpvj/Data/backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Centro Cultural Víctor Jara - Database Initialization${NC}"
echo "=================================================="

# Check if SQLite is installed
if ! command -v sqlite3 &> /dev/null; then
    echo -e "${RED}❌ SQLite3 is not installed. Installing...${NC}"
    sudo apt update && sudo apt install sqlite3
fi

# Create Data directory if it doesn't exist
if [ ! -d "/home/user/ccpvj/Data" ]; then
    echo -e "${YELLOW}📁 Creating Data directory...${NC}"
    mkdir -p /home/user/ccpvj/Data/media/{temp,uploads}/{images,videos,audio}
fi

# Create backup directory
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${YELLOW}📁 Creating backup directory...${NC}"
    mkdir -p "$BACKUP_DIR"
fi

# Backup existing database if it exists
if [ -f "$DB_PATH" ]; then
    BACKUP_NAME="ccpvj_backup_$(date +%Y%m%d_%H%M%S).db"
    echo -e "${YELLOW}💾 Backing up existing database to: $BACKUP_NAME${NC}"
    cp "$DB_PATH" "$BACKUP_DIR/$BACKUP_NAME"
fi

# Check if SQL file exists
if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}❌ SQL file not found: $SQL_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}🗄️  Initializing database at: $DB_PATH${NC}"

# Execute SQL script
echo -e "${YELLOW}⚙️  Executing SQL schema...${NC}"
sqlite3 "$DB_PATH" < "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database schema created successfully!${NC}"
else
    echo -e "${RED}❌ Error creating database schema${NC}"
    exit 1
fi

# Set proper permissions
chmod 664 "$DB_PATH"
chmod -R 755 "/home/user/ccpvj/Data"

# Verify database structure
echo -e "${BLUE}🔍 Verifying database structure...${NC}"
echo "Tables created:"
sqlite3 "$DB_PATH" ".tables" | tr ' ' '\n' | sort

echo ""
echo "Database size:"
ls -lh "$DB_PATH"

echo ""
echo -e "${GREEN}🎉 Database initialization completed successfully!${NC}"
echo ""
echo "Available tables:"
echo "=================="
echo "👤 Authentication: user, session, Rol, Usuario"
echo "📚 Education: Course, Module"  
echo "📁 Media: MediaEntity, UploadStatus"
echo "🔐 Security: RefreshToken, TokenBlacklist"
echo "📝 Content: BlogPost, BlogCategory"
echo "📅 Events: Event, EventRegistration"
echo ""
echo "Next steps:"
echo "1. Run: cd /home/user/ccpvj/Front && npm run db:seed"
echo "2. Or manually add users using the created tables"
echo ""
echo "Database location: $DB_PATH"
if [ -f "$BACKUP_DIR/$BACKUP_NAME" ]; then
    echo "Backup location: $BACKUP_DIR/$BACKUP_NAME"
fi