#!/bin/bash

# Make all scripts executable
# Run this once after cloning the repository

echo "🔧 Setting up MyJudicial deployment scripts..."
echo ""

# List of scripts to make executable
scripts=(
    "deploy-oci.sh"
    "setup-environment.sh"
    "health-check.sh"
    "maintenance.sh"
    "backup-db.sh"
    "monitor.sh"
)

# Make each script executable
for script in "${scripts[@]}"; do
    if [ -f "$script" ]; then
        chmod +x "$script"
        echo "✓ $script is now executable"
    else
        echo "⚠ $script not found (this is OK if you haven't created it yet)"
    fi
done

echo ""
echo "✓ Setup complete!"
echo ""
echo "Available scripts:"
echo "  ./setup-environment.sh  - Interactive environment configuration"
echo "  ./deploy-oci.sh         - Automated deployment"
echo "  ./health-check.sh       - Check service health"
echo "  ./maintenance.sh        - Maintenance menu"
echo ""
echo "Next steps:"
echo "1. Run: ./setup-environment.sh (to configure .env)"
echo "2. Run: ./deploy-oci.sh (to deploy)"
