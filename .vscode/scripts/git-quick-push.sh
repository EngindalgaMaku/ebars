#!/bin/bash

# Git Quick Push Script
# Quick commit with custom message and push

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}⚡ Git Quick Push Script${NC}"
echo "=================================="

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Not in a git repository${NC}"
    exit 1
fi

# Check if commit message is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Commit message is required${NC}"
    echo -e "${YELLOW}Usage: $0 \"Your commit message\"${NC}"
    exit 1
fi

COMMIT_MSG="$1"

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
    git log --oneline -3
else
    echo -e "${RED}❌ Failed to push to remote${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Git quick-push completed successfully!${NC}"