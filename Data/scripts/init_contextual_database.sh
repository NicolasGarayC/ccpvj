#!/bin/bash

# =====================================================
# CENTRO CULTURAL VÍCTOR JARA - Contextual Database Initialization
# =====================================================

set -e  # Exit on any error

# Configuration
DB_PATH="/home/user/ccpvj/Data/ccpvj.db"
SQL_FILE="/home/user/ccpvj/Data/database_tables_contextual_fixed.sql"
BACKUP_DIR="/home/user/ccpvj/Data/backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Centro Cultural Víctor Jara - Contextual Multimedia Database${NC}"
echo "=============================================================="

# Check if SQLite is installed
if ! command -v sqlite3 &> /dev/null; then
    echo -e "${RED}❌ SQLite3 is not installed. Installing...${NC}"
    sudo apt update && sudo apt install sqlite3
fi

# Create comprehensive directory structure for contextual multimedia
echo -e "${YELLOW}📁 Creating contextual media directory structure...${NC}"
mkdir -p /home/user/ccpvj/Data/media/{courses,workitems,blog,events}
mkdir -p /home/user/ccpvj/Data/media/temp/uploads/{courses,workitems,blog,events}

# Set proper permissions
chmod -R 755 /home/user/ccpvj/Data/

# Create backup directory
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
fi

# Backup existing database if it exists
if [ -f "$DB_PATH" ]; then
    BACKUP_NAME="ccpvj_contextual_backup_$(date +%Y%m%d_%H%M%S).db"
    echo -e "${YELLOW}💾 Backing up existing database to: $BACKUP_NAME${NC}"
    cp "$DB_PATH" "$BACKUP_DIR/$BACKUP_NAME"
fi

# Check if SQL file exists
if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}❌ Contextual SQL file not found: $SQL_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}🗄️  Initializing contextual multimedia database...${NC}"

# Execute SQL script
echo -e "${YELLOW}⚙️  Executing contextual schema...${NC}"
sqlite3 "$DB_PATH" < "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Contextual database schema created successfully!${NC}"
else
    echo -e "${RED}❌ Error creating contextual database schema${NC}"
    exit 1
fi

# Set proper permissions
chmod 664 "$DB_PATH"

echo -e "${BLUE}🔍 Verifying contextual database structure...${NC}"
echo ""
echo "📊 Database Statistics:"
echo "======================"

# Get table counts
echo "Tables created:"
sqlite3 "$DB_PATH" ".tables" | tr ' ' '\n' | sort

echo ""
echo "📈 Table Row Counts:"
for table in $(sqlite3 "$DB_PATH" ".tables"); do
    count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM $table;")
    printf "  %-20s %d rows\n" "$table:" "$count"
done

echo ""
echo "💾 Database size: $(ls -lh "$DB_PATH" | awk '{print $5}')"

echo ""
echo -e "${GREEN}🎉 Contextual multimedia database initialization completed!${NC}"
echo ""
echo "📋 Contextual Architecture Summary:"
echo "===================================="
echo "🏫  Educational Content:"
echo "    • Course → Module → WorkItem (with contextual media)"
echo "    • Subjects: Matemáticas, Física, Sociales, Economía"
echo "    • WorkItem media: images, videos per work item"
echo ""
echo "📝  Blog System:"
echo "    • BlogPost with contextual multimedia"
echo "    • Blog media: featured images, PDFs, videos per post"
echo ""
echo "📅  Event System:"  
echo "    • Events with contextual images"
echo "    • Event media: posters, promotional images per event"
echo ""
echo "📁  Contextual Media Tracking:"
echo "    • MediaFile table links files to specific content"
echo "    • No independent multimedia - always belongs to content"
echo "    • Upload tracking with content context"
echo ""

echo "🗂️  Media Directory Structure:"
echo "  /home/user/ccpvj/Data/media/"
echo "  ├── courses/     (course banners)"
echo "  ├── workitems/   (work item images & videos)"
echo "  ├── blog/        (blog images, PDFs, videos)"
echo "  ├── events/      (event posters)"
echo "  └── temp/        (temporary uploads)"
echo ""

echo "📖 Usage Examples:"
echo "=================="
echo "📚 Course Creation Flow:"
echo "  1. Create Course with subject (Matemáticas, Física, etc.)"
echo "  2. Add Modules to Course"
echo "  3. Add WorkItems to Module with:"
echo "     • Title, Description, Long Text"
echo "     • Image (diagram/illustration)"
echo "     • Video (instructional content)"
echo ""
echo "✍️  Blog Post Flow:"
echo "  1. Create BlogPost with category"
echo "  2. Add contextual multimedia:"
echo "     • Featured Image"
echo "     • PDF documents"
echo "     • Embedded videos"
echo ""
echo "🎪 Event Creation Flow:"
echo "  1. Create Event with date/time/location"
echo "  2. Add event poster/image"
echo ""

echo "🔄 Next Steps:"
echo "=============="
echo "1. Update Drizzle schema:"
echo "   cp /home/user/ccpvj/Front/src/lib/server/db/schema-contextual.ts"
echo "   cp /home/user/ccpvj/Front/src/lib/server/db/schema.ts"
echo ""
echo "2. Regenerate Drizzle migrations:"
echo "   cd /home/user/ccpvj/Front && npm run db:generate"
echo ""
echo "3. Update your NGINX upload paths for contextual directories"
echo ""
echo "4. Test contextual queries using the provided views:"
echo "   • CourseWithMedia"
echo "   • WorkItemWithMedia" 
echo "   • BlogPostWithMedia"
echo "   • EventWithMedia"
echo ""

if [ -f "$BACKUP_DIR/$BACKUP_NAME" ]; then
    echo "💾 Previous database backed up to: $BACKUP_DIR/$BACKUP_NAME"
fi

echo ""
echo -e "${GREEN}🚀 Ready for contextual multimedia implementation!${NC}"