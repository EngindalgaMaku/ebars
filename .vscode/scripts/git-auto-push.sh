#!/bin/bash

# Git Auto Push Script
# Automatically adds, commits, and pushes changes with a timestamp

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Git Auto Push Script${NC}"
echo "=================================="

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Not in a git repository${NC}"
    exit 1
fi

# Check if there are any changes
if git diff --quiet && git diff --staged --quiet; then
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
    exit 0
fi

# Get current branch
BRANCH=$(git branch --show-current)
echo -e "${BLUE}📍 Current branch: ${BRANCH}${NC}"

# Show status
echo -e "${BLUE}📊 Git Status:${NC}"
git status --short

# Add all changes
echo -e "${BLUE}➕ Adding all changes...${NC}"
git add .

# Generate commit message with timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
COMMIT_MSG="feat: auto-commit - ${TIMESTAMP}"

# Allow custom commit message via parameter
if [ ! -z "$1" ]; then
    COMMIT_MSG="$1"
fi

echo -e "${BLUE}💬 Commit message: ${COMMIT_MSG}${NC}"

# Commit changes
echo -e "${BLUE}📝 Committing changes...${NC}"
git commit -m "$COMMIT_MSG"

# Push to remote
echo -e "${BLUE}🚀 Pushing to remote...${NC}"
if git push origin "$BRANCH"; then
    echo -e "${GREEN}✅ Successfully pushed to origin/${BRANCH}${NC}"
    
    # Show recent commits
    echo -e "${BLUE}📋 Recent commits:${NC}"
    git log --oneline -5
else
    echo -e "${RED}❌ Failed to push to remote${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Git auto-push completed successfully!${NC}"