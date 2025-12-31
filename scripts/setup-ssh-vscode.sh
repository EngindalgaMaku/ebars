#!/bin/bash
# SSH Setup Script for VS Code Remote Development
# RAG Education Assistant Project

set -e

echo "🔐 Setting up SSH for VS Code Remote Development"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if running on Windows (Git Bash, WSL, etc.)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    SSH_DIR="$HOME/.ssh"
    VSCODE_DIR="$HOME/AppData/Roaming/Code/User"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    SSH_DIR="$HOME/.ssh"
    VSCODE_DIR="$HOME/.config/Code/User"
else
    SSH_DIR="$HOME/.ssh"
    VSCODE_DIR="$HOME/.config/Code/User"
fi

# Create SSH directory if it doesn't exist
mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"

# Create SSH sockets directory for connection multiplexing
mkdir -p "$SSH_DIR/sockets"
chmod 700 "$SSH_DIR/sockets"

print_info "SSH directory: $SSH_DIR"

# Function to generate SSH key
generate_ssh_key() {
    local key_name="id_rsa_ebars"
    local key_path="$SSH_DIR/$key_name"
    
    if [[ -f "$key_path" ]]; then
        print_warning "SSH key already exists at $key_path"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Using existing SSH key"
            return 0
        fi
    fi
    
    print_info "Generating SSH key pair..."
    read -p "Enter your email address: " email
    
    ssh-keygen -t rsa -b 4096 -C "$email" -f "$key_path" -N ""
    chmod 600 "$key_path"
    chmod 644 "$key_path.pub"
    
    print_status "SSH key generated successfully!"
    print_info "Public key location: $key_path.pub"
    print_info "Private key location: $key_path"
}

# Function to setup SSH config
setup_ssh_config() {
    local ssh_config="$SSH_DIR/config"
    local project_ssh_config=".vscode/ssh_config"
    
    print_info "Setting up SSH configuration..."
    
    # Read server details
    read -p "Enter your server IP or domain: " server_host
    read -p "Enter your username on the server: " server_user
    read -p "Enter SSH port (default 22): " server_port
    server_port=${server_port:-22}
    
    # Update the project SSH config with actual values
    if [[ -f "$project_ssh_config" ]]; then
        sed -i.bak \
            -e "s/YOUR_SERVER_IP_OR_DOMAIN/$server_host/g" \
            -e "s/YOUR_USERNAME/$server_user/g" \
            -e "s/Port 22/Port $server_port/g" \
            "$project_ssh_config"
        print_status "Updated project SSH config"
    fi
    
    # Add to main SSH config if not exists
    if ! grep -q "Host ebars-prod" "$ssh_config" 2>/dev/null; then
        cat >> "$ssh_config" << EOF

# RAG Education Assistant - Added by setup script
Include $(pwd)/.vscode/ssh_config

EOF
        print_status "Added project SSH config to main SSH config"
    else
        print_warning "SSH config already contains ebars-prod host"
    fi
    
    chmod 600 "$ssh_config"
}

# Function to copy public key to server
copy_public_key() {
    local key_path="$SSH_DIR/id_rsa_ebars.pub"
    
    if [[ ! -f "$key_path" ]]; then
        print_error "Public key not found at $key_path"
        return 1
    fi
    
    print_info "Your public key:"
    echo "----------------------------------------"
    cat "$key_path"
    echo "----------------------------------------"
    
    print_info "Copy the above public key to your server's ~/.ssh/authorized_keys file"
    print_info "You can do this by running the following command on your server:"
    echo ""
    echo "mkdir -p ~/.ssh && echo '$(cat "$key_path")' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh"
    echo ""
    
    read -p "Press Enter after you've added the key to your server..."
}

# Function to test SSH connection
test_ssh_connection() {
    print_info "Testing SSH connection..."
    
    if ssh -F .vscode/ssh_config -o ConnectTimeout=10 ebars-prod "echo 'SSH connection successful!'" 2>/dev/null; then
        print_status "SSH connection test successful!"
        return 0
    else
        print_error "SSH connection test failed!"
        print_info "Please check:"
        print_info "1. Server IP/domain is correct"
        print_info "2. SSH port is correct"
        print_info "3. Username is correct"
        print_info "4. Public key is added to server's authorized_keys"
        print_info "5. Server SSH service is running"
        return 1
    fi
}

# Function to setup VS Code extensions
setup_vscode_extensions() {
    print_info "Setting up VS Code extensions..."
    
    # Check if code command is available
    if command -v code &> /dev/null; then
        print_info "Installing Remote-SSH extension..."
        code --install-extension ms-vscode-remote.remote-ssh
        code --install-extension ms-vscode-remote.remote-ssh-edit
        code --install-extension ms-vscode-remote.remote-containers
        code --install-extension ms-vscode-remote.vscode-remote-extensionpack
        print_status "VS Code extensions installed!"
    else
        print_warning "VS Code 'code' command not found in PATH"
        print_info "Please install the following extensions manually:"
        print_info "- Remote - SSH"
        print_info "- Remote - SSH: Editing Configuration Files"
        print_info "- Remote - Containers"
        print_info "- Remote Development Extension Pack"
    fi
}

# Function to create workspace file
create_workspace() {
    local workspace_file="ebars-remote.code-workspace"
    
    cat > "$workspace_file" << 'EOF'
{
    "folders": [
        {
            "name": "RAG Education Assistant",
            "uri": "vscode-remote://ssh-remote+ebars-prod/home/YOUR_USERNAME/ebars"
        }
    ],
    "settings": {
        "remote.SSH.configFile": ".vscode/ssh_config",
        "remote.SSH.showLoginTerminal": true,
        "terminal.integrated.defaultProfile.linux": "bash"
    },
    "extensions": {
        "recommendations": [
            "ms-python.python",
            "ms-vscode.vscode-typescript-next",
            "bradlc.vscode-tailwindcss",
            "ms-vscode.vscode-json",
            "ms-vscode-remote.remote-ssh",
            "ms-vscode.docker",
            "ms-vscode.makefile-tools"
        ]
    }
}
EOF
    
    # Update with actual username
    if [[ -n "$server_user" ]]; then
        sed -i.bak "s/YOUR_USERNAME/$server_user/g" "$workspace_file"
    fi
    
    print_status "Created VS Code workspace file: $workspace_file"
}

# Main setup process
main() {
    echo ""
    print_info "Starting SSH setup for VS Code Remote Development..."
    echo ""
    
    # Step 1: Generate SSH key
    print_info "Step 1: SSH Key Generation"
    generate_ssh_key
    echo ""
    
    # Step 2: Setup SSH config
    print_info "Step 2: SSH Configuration"
    setup_ssh_config
    echo ""
    
    # Step 3: Copy public key to server
    print_info "Step 3: Copy Public Key to Server"
    copy_public_key
    echo ""
    
    # Step 4: Test SSH connection
    print_info "Step 4: Test SSH Connection"
    if test_ssh_connection; then
        echo ""
        
        # Step 5: Setup VS Code extensions
        print_info "Step 5: VS Code Extensions"
        setup_vscode_extensions
        echo ""
        
        # Step 6: Create workspace
        print_info "Step 6: Create VS Code Workspace"
        create_workspace
        echo ""
        
        print_status "🎉 SSH setup completed successfully!"
        echo ""
        print_info "Next steps:"
        print_info "1. Open VS Code"
        print_info "2. Open the workspace file: ebars-remote.code-workspace"
        print_info "3. Or use Ctrl+Shift+P -> 'Remote-SSH: Connect to Host' -> 'ebars-prod'"
        print_info "4. VS Code will automatically install the VS Code Server on the remote machine"
        echo ""
        print_info "Useful commands:"
        print_info "- Test connection: ssh -F .vscode/ssh_config ebars-prod"
        print_info "- View logs: ssh -F .vscode/ssh_config ebars-prod 'cd ~/ebars && docker-compose logs -f'"
        print_info "- Deploy: ssh -F .vscode/ssh_config ebars-prod 'cd ~/ebars && ./scripts/deploy-prod.sh'"
        
    else
        print_error "Setup incomplete due to SSH connection failure"
        print_info "Please fix the connection issues and run the script again"
        exit 1
    fi
}

# Run main function
main "$@"