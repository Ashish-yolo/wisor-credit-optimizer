#!/bin/bash

# Build script for Render deployment

echo "🔧 Starting build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Create required directories
echo "📁 Creating required directories..."
mkdir -p uploads
mkdir -p logs

# Set permissions
echo "🔒 Setting permissions..."
chmod 755 uploads
chmod 755 logs

# Verify installation
echo "✅ Verifying installation..."
node --version
npm --version

echo "🚀 Build completed successfully!"

exit 0