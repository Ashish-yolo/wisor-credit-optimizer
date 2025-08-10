#!/bin/bash

# Create dist directory
mkdir -p dist

# Copy essential files
cp public/index.html dist/
cp assets/favicon.png dist/
cp public/_redirects dist/

echo "✅ Static build completed successfully!"
echo "📁 Files copied to dist directory:"
ls -la dist/