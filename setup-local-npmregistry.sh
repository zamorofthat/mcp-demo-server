#!/bin/bash

# Setup script for local npm registry demo
echo "Setting up local npm registry for conference demo..."

# Check if verdaccio is installed
if ! command -v verdaccio &> /dev/null; then
    echo "Installing verdaccio..."
    npm install -g verdaccio
else
    echo "Verdaccio already installed"
fi

echo "Starting verdaccio on port 4873 with local config..."
verdaccio --config ./verdaccio-config.yaml &

sleep 3

# Set npm to use local registry for @ai-tools scope
echo "Configuring npm to use local registry for @ai-tools..."
npm config set @ai-tools:registry http://localhost:4873/

echo "Publishing package to local registry (anonymous mode)..."
npm publish --registry http://localhost:4873/

echo ""
echo "✅ Local registry setup complete!"
echo ""
echo "Demo commands for conference:"
echo "1. Show the package on local registry: http://localhost:4873/"
echo "2. Install command: npm install -g @ai-tools/productivity-optimizer"
echo "3. The package will install from local registry, not real npm"
echo ""
echo "To stop verdaccio: pkill verdaccio"