#!/bin/bash
# Otomatik Deploy Script
# Kullanım: bash scripts/deploy-auto.sh "commit mesajı"

set -e

# Renkli output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Sunucu bilgileri
SERVER="root@ebars.kodleon.com"
REMOTE_DIR="/root/ebars"

# Commit mesajı
COMMIT_MSG="${1:-Auto deploy $(date '+%Y-%m-%d %H:%M:%S')}"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}   EBARS Otomatik Deploy Başlatılıyor   ${NC}"
echo -e "${YELLOW}========================================${NC}"

# 1. Git add
echo -e "\n${GREEN}[1/5] Git add...${NC}"
git add .

# 2. Git commit
echo -e "\n${GREEN}[2/5] Git commit...${NC}"
git commit -m "$COMMIT_MSG" || echo -e "${YELLOW}Commit edilecek değişiklik yok veya zaten commit edilmiş${NC}"

# 3. Git push
echo -e "\n${GREEN}[3/5] Git push...${NC}"
git push origin main || git push origin master

# 4. SSH ile sunucuda git pull
echo -e "\n${GREEN}[4/5] Sunucuda git pull...${NC}"
ssh $SERVER "cd $REMOTE_DIR && git pull"

# 5. Deploy script çalıştır
echo -e "\n${GREEN}[5/5] Docker deploy başlatılıyor...${NC}"
ssh $SERVER "cd $REMOTE_DIR && bash scripts/deploy-prod.sh"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   Deploy Tamamlandı!                   ${NC}"
echo -e "${GREEN}========================================${NC}"
