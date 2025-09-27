#!/bin/bash

# Wisor Deployment Script
# This script builds and prepares both web app and extension for deployment

set -e

echo "🚀 Starting Wisor deployment preparation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "SETUP_GUIDE.md" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed. Please install it first: npm install -g pnpm"
    exit 1
fi

print_status "Checking prerequisites..."

# Check if .env files exist
if [ ! -f "wisor-web-app/.env.local" ]; then
    print_warning "Web app .env.local not found. Please copy from .env.example and configure."
fi

if [ ! -f "extension/.env" ]; then
    print_warning "Extension .env not found. Please copy from .env.example and configure."
fi

# Build Web App
echo -e "\n📱 Building Next.js Web App..."
cd wisor-web-app

if [ ! -d "node_modules" ]; then
    print_status "Installing web app dependencies..."
    pnpm install
fi

print_status "Building web app for production..."
pnpm build

if [ $? -eq 0 ]; then
    print_status "Web app build completed successfully!"
else
    print_error "Web app build failed!"
    exit 1
fi

# Build Extension
echo -e "\n🔌 Building Chrome Extension..."
cd ../extension

if [ ! -d "node_modules" ]; then
    print_status "Installing extension dependencies..."
    pnpm install
fi

print_status "Building extension for production..."
pnpm build

if [ $? -eq 0 ]; then
    print_status "Extension build completed successfully!"
else
    print_error "Extension build failed!"
    exit 1
fi

# Package Extension
print_status "Packaging extension..."
pnpm package

if [ $? -eq 0 ]; then
    print_status "Extension packaged successfully!"
else
    print_error "Extension packaging failed!"
    exit 1
fi

# Back to root
cd ..

echo -e "\n🎉 ${GREEN}Deployment preparation completed!${NC}"
echo -e "\n📋 Next steps:"
echo -e "   ${YELLOW}Web App:${NC}"
echo -e "   • Deploy wisor-web-app/.next to your hosting provider"
echo -e "   • Configure environment variables in hosting dashboard"
echo -e "   • Suggested: Vercel, Netlify, or Railway"
echo -e "\n   ${YELLOW}Extension:${NC}"
echo -e "   • Upload extension/build/chrome-mv3-prod.zip to Chrome Web Store"
echo -e "   • Or distribute extension/build/chrome-mv3-prod folder for manual installation"
echo -e "\n   ${YELLOW}Database:${NC}"
echo -e "   • Ensure Supabase is configured with production settings"
echo -e "   • Update CORS settings for your production domain"
echo -e "   • Configure SMS provider for phone authentication"

echo -e "\n📚 For detailed deployment instructions, see SETUP_GUIDE.md"
echo -e "\n🚀 Happy deploying!"