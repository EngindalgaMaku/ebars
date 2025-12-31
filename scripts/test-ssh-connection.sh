#!/bin/bash
# SSH Connection Test Script
# RAG Education Assistant Project

set -e

echo "🔍 Testing SSH Connection for VS Code Remote Development"
echo "======================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if SSH config exists
if [[ ! -f ".vscode/ssh_config" ]]; then
    print_error "SSH config file not found at .vscode/ssh_config"
    print_info "Please run the setup script first:"
    print_info "  ./scripts/setup-ssh-vscode.sh"
    exit 1
fi

print_status "SSH config file found"

# Check if SSH key exists
SSH_KEY_PATH="$HOME/.ssh/id_rsa_ebars"
if [[ ! -f "$SSH_KEY_PATH" ]]; then
    print_error "SSH key not found at $SSH_KEY_PATH"
    print_info "Please run the setup script to generate SSH keys"
    exit 1
fi

print_status "SSH key found"

# Check SSH key permissions
KEY_PERMS=$(stat -c "%a" "$SSH_KEY_PATH" 2>/dev/null || stat -f "%A" "$SSH_KEY_PATH" 2>/dev/null)
if [[ "$KEY_PERMS" != "600" ]]; then
    print_warning "SSH key permissions are $KEY_PERMS, should be 600"
    chmod 600 "$SSH_KEY_PATH"
    print_status "Fixed SSH key permissions"
fi

# Test SSH connection
print_info "Testing SSH connection to ebars-prod..."

if ssh -F .vscode/ssh_config -o ConnectTimeout=10 -o BatchMode=yes ebars-prod "echo 'SSH connection successful!'" 2>/dev/null; then
    print_status "SSH connection test successful!"
    
    # Test remote directory
    print_info "Checking remote directory..."
    if ssh -F .vscode/ssh_config ebars-prod "test -d ~/ebars" 2>/dev/null; then
        print_status "Remote directory ~/ebars exists"
        
        # Check if it's a git repository
        if ssh -F .vscode/ssh_config ebars-prod "test -d ~/ebars/.git" 2>/dev/null; then
            print_status "Remote directory is a git repository"
        else
            print_warning "Remote directory is not a git repository"
        fi
        
        # Check for key files
        print_info "Checking for key project files..."
        
        if ssh -F .vscode/ssh_config ebars-prod "test -f ~/ebars/docker-compose.prod.yml" 2>/dev/null; then
            print_status "docker-compose.prod.yml found"
        else
            print_warning "docker-compose.prod.yml not found"
        fi
        
        if ssh -F .vscode/ssh_config ebars-prod "test -f ~/ebars/scripts/deploy-prod.sh" 2>/dev/null; then
            print_status "deploy-prod.sh script found"
        else
            print_warning "deploy-prod.sh script not found"
        fi
        
        if ssh -F .vscode/ssh_config ebars-prod "test -d ~/ebars/frontend" 2>/dev/null; then
            print_status "frontend directory found"
        else
            print_warning "frontend directory not found"
        fi
        
        if ssh -F .vscode/ssh_config ebars-prod "test -d ~/ebars/src" 2>/dev/null; then
            print_status "src directory found"
        else
            print_warning "src directory not found"
        fi
        
    else
        print_error "Remote directory ~/ebars does not exist"
        print_info "Please ensure the project is deployed to ~/ebars on the remote server"
    fi
    
    # Test Docker availability
    print_info "Checking Docker availability..."
    if ssh -F .vscode/ssh_config ebars-prod "command -v docker >/dev/null 2>&1" 2>/dev/null; then
        print_status "Docker is available on remote server"
        
        # Check Docker Compose
        if ssh -F .vscode/ssh_config ebars-prod "command -v docker-compose >/dev/null 2>&1" 2>/dev/null; then
            print_status "Docker Compose is available"
        else
            print_warning "Docker Compose not found"
        fi
    else
        print_warning "Docker not found on remote server"
    fi
    
    # Test port forwarding
    print_info "Testing port forwarding..."
    
    # Start a background SSH connection with port forwarding
    ssh -F .vscode/ssh_config -N -L 8080:localhost:80 ebars-prod &
    SSH_PID=$!
    sleep 2
    
    # Check if port is forwarded
    if netstat -an 2>/dev/null | grep -q ":8080.*LISTEN" || ss -an 2>/dev/null | grep -q ":8080.*LISTEN"; then
        print_status "Port forwarding test successful"
    else
        print_warning "Port forwarding test failed"
    fi
    
    # Kill the background SSH process
    kill $SSH_PID 2>/dev/null || true
    
else
    print_error "SSH connection test failed!"
    print_info "Troubleshooting steps:"
    print_info "1. Check server IP/hostname in .vscode/ssh_config"
    print_info "2. Verify SSH port (default: 22)"
    print_info "3. Ensure public key is added to server's ~/.ssh/authorized_keys"
    print_info "4. Check if SSH service is running on the server"
    print_info "5. Verify firewall settings"
    
    # Try verbose connection for debugging
    print_info "Running verbose SSH test..."
    ssh -F .vscode/ssh_config -v ebars-prod "echo 'Connection test'" 2>&1 | head -20
    
    exit 1
fi

# Check VS Code extensions
print_info "Checking VS Code Remote-SSH extension..."

if command -v code >/dev/null 2>&1; then
    if code --list-extensions | grep -q "ms-vscode-remote.remote-ssh"; then
        print_status "Remote-SSH extension is installed"
    else
        print_warning "Remote-SSH extension not found"
        print_info "Install with: code --install-extension ms-vscode-remote.remote-ssh"
    fi
else
    print_warning "VS Code 'code' command not found in PATH"
fi

# Check workspace file
if [[ -f "ebars-remote.code-workspace" ]]; then
    print_status "VS Code workspace file found"
else
    print_warning "VS Code workspace file not found"
fi

echo ""
print_status "🎉 SSH connection test completed!"
echo ""
print_info "Next steps:"
print_info "1. Open VS Code"
print_info "2. Open workspace: code ebars-remote.code-workspace"
print_info "3. Or connect directly: Ctrl+Shift+P → 'Remote-SSH: Connect to Host' → 'ebars-prod'"
print_info "4. VS Code will install VS Code Server on first connection"
echo ""
print_info "Useful commands:"
print_info "- Connect: ssh -F .vscode/ssh_config ebars-prod"
print_info "- Deploy: ssh -F .vscode/ssh_config ebars-prod 'cd ~/ebars && ./scripts/deploy-prod.sh'"
print_info "- Logs: ssh -F .vscode/ssh_config ebars-prod 'cd ~/ebars && docker-compose -f docker-compose.prod.yml logs -f'"