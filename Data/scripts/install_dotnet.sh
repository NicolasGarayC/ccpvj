#!/bin/bash

# =====================================================
# CENTRO CULTURAL VÍCTOR JARA - .NET 8 SDK Installation
# =====================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Installing .NET 8 SDK for Ubuntu 24.04${NC}"
echo "================================================"

# Check if running on Ubuntu
if ! command -v lsb_release &> /dev/null; then
    echo -e "${RED}❌ This script is designed for Ubuntu. Please install manually.${NC}"
    exit 1
fi

UBUNTU_VERSION=$(lsb_release -rs)
echo -e "${YELLOW}📊 Detected Ubuntu version: $UBUNTU_VERSION${NC}"

# Step 1: Update package list
echo -e "${YELLOW}📦 Updating package list...${NC}"
sudo apt update

# Step 2: Install prerequisites
echo -e "${YELLOW}🔧 Installing prerequisites...${NC}"
sudo apt install -y wget apt-transport-https software-properties-common

# Step 3: Download Microsoft package signing key and repository
echo -e "${YELLOW}🔑 Adding Microsoft package repository...${NC}"
wget https://packages.microsoft.com/config/ubuntu/24.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
rm packages-microsoft-prod.deb

# Step 4: Update package list again with Microsoft repo
echo -e "${YELLOW}📦 Updating package list with Microsoft repository...${NC}"
sudo apt update

# Step 5: Install .NET 8 SDK
echo -e "${YELLOW}⬇️ Installing .NET 8 SDK...${NC}"
sudo apt install -y dotnet-sdk-8.0

# Step 6: Verify installation
echo -e "${BLUE}✅ Verifying .NET installation...${NC}"
if command -v dotnet &> /dev/null; then
    DOTNET_VERSION=$(dotnet --version)
    echo -e "${GREEN}✅ .NET SDK installed successfully!${NC}"
    echo -e "${GREEN}📊 Version: $DOTNET_VERSION${NC}"
    
    # Additional verification
    echo -e "${BLUE}🔍 Additional verification:${NC}"
    dotnet --info | head -20
    
    echo ""
    echo -e "${GREEN}🎉 .NET 8 SDK installation completed!${NC}"
    echo -e "${YELLOW}📁 You can now build the backend:${NC}"
    echo "   cd /home/user/ccpvj/Back/"
    echo "   dotnet restore"
    echo "   dotnet build"
    echo "   dotnet run"
    
else
    echo -e "${RED}❌ .NET installation failed. Please check the output above.${NC}"
    exit 1
fi

# Step 7: Test basic functionality
echo -e "${BLUE}🧪 Testing basic .NET functionality...${NC}"
cd /tmp
dotnet new console -n TestDotNet --force
cd TestDotNet
echo 'Console.WriteLine("✅ .NET SDK is working correctly!");' > Program.cs
dotnet run
cd /tmp && rm -rf TestDotNet

echo ""
echo -e "${GREEN}🚀 .NET 8 SDK is ready for Centro Cultural Víctor Jara!${NC}"