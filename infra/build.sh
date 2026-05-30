#!/bin/bash
set -e

# build.sh
# Automates packaging third-party python dependencies directly into the package directory
# so that Hashicorp's archive_file can compile everything into a valid AWS Lambda ZIP.

echo "=========================================="
echo "Preparing Redirect Inspector Backend Build"
echo "=========================================="

cd "$(dirname "$0")/../backend"

# Clean up previous build artifacts
echo "Cleaning up previous dependencies..."
find . -maxdepth 1 -not -name 'app' \
                   -not -name 'requirements.txt' \
                   -not -name 'README.md' \
                   -not -name '.' \
                   -not -name '..' \
                   -exec rm -rf {} + || true

# Install fresh dependencies into the current folder
echo "Installing pip requirements locally..."
pip install --target . -r requirements.txt --quiet --no-cache-dir

# Remove bulky unnecessary files to save Lambda package space
echo "Pruning cache files..."
find . -type d -name "__pycache__" -exec rm -rf {} + || true
find . -type d -name "*.dist-info" -exec rm -rf {} + || true
find . -type d -name "*.egg-info" -exec rm -rf {} + || true

echo "=========================================="
echo "Build Completed successfully! Run Terraform now."
echo "=========================================="
