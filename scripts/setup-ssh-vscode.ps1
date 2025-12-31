# SSH Setup Script for VS Code Remote Development (PowerShell)
# RAG Education Assistant Project

param(
    [string]$ServerHost = "",
    [string]$ServerUser = "",
    [int]$ServerPort = 22
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🔐 Setting up SSH for VS Code Remote Development" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

# Determine SSH directory based on OS
$SSHDir = "$env:USERPROFILE\.ssh"
$VSCodeDir = "$env:APPDATA\Code\User"

# Create SSH directory if it doesn't exist
if (!(Test-Path $SSHDir)) {
    New-Item -ItemType Directory -Path $SSHDir -Force | Out-Null
}

# Create SSH sockets directory for connection multiplexing
$SocketsDir = "$SSHDir\sockets"
if (!(Test-Path $SocketsDir)) {
    New-Item -ItemType Directory -Path $SocketsDir -Force | Out-Null
}

Write-Info "SSH directory: $SSHDir"

# Function to generate SSH key
function New-SSHKey {
    $KeyName = "id_rsa_ebars"
    $KeyPath = "$SSHDir\$KeyName"
    
    if (Test-Path $KeyPath) {
        Write-Warning "SSH key already exists at $KeyPath"
        $Overwrite = Read-Host "Do you want to overwrite it? (y/N)"
        if ($Overwrite -ne "y" -and $Overwrite -ne "Y") {
            Write-Info "Using existing SSH key"
            return $KeyPath
        }
    }
    
    Write-Info "Generating SSH key pair..."
    $Email = Read-Host "Enter your email address"
    
    # Generate SSH key using ssh-keygen
    $Process = Start-Process -FilePath "ssh-keygen" -ArgumentList @("-t", "rsa", "-b", "4096", "-C", $Email, "-f", $KeyPath, "-N", '""') -Wait -PassThru -NoNewWindow
    
    if ($Process.ExitCode -eq 0) {
        Write-Status "SSH key generated successfully!"
        Write-Info "Public key location: $KeyPath.pub"
        Write-Info "Private key location: $KeyPath"
        return $KeyPath
    }
    else {
        Write-Error "Failed to generate SSH key"
        throw "SSH key generation failed"
    }
}

# Function to setup SSH config
function Set-SSHConfig {
    param([string]$ServerHost, [string]$ServerUser, [int]$ServerPort)
    
    $SSHConfig = "$SSHDir\config"
    $ProjectSSHConfig = ".vscode\ssh_config"
    
    Write-Info "Setting up SSH configuration..."
    
    # Read server details if not provided
    if ([string]::IsNullOrEmpty($ServerHost)) {
        $ServerHost = Read-Host "Enter your server IP or domain"
    }
    if ([string]::IsNullOrEmpty($ServerUser)) {
        $ServerUser = Read-Host "Enter your username on the server"
    }
    if ($ServerPort -eq 0) {
        $PortInput = Read-Host "Enter SSH port (default 22)"
        if (![string]::IsNullOrEmpty($PortInput)) {
            $ServerPort = [int]$PortInput
        }
        else {
            $ServerPort = 22
        }
    }
    
    # Update the project SSH config with actual values
    if (Test-Path $ProjectSSHConfig) {
        $Content = Get-Content $ProjectSSHConfig -Raw
        $Content = $Content -replace "YOUR_SERVER_IP_OR_DOMAIN", $ServerHost
        $Content = $Content -replace "YOUR_USERNAME", $ServerUser
        $Content = $Content -replace "Port 22", "Port $ServerPort"
        Set-Content -Path $ProjectSSHConfig -Value $Content
        Write-Status "Updated project SSH config"
    }
    
    # Add to main SSH config if not exists
    if (!(Test-Path $SSHConfig) -or !(Select-String -Path $SSHConfig -Pattern "Host ebars-prod" -Quiet)) {
        $IncludeLine = "`n# RAG Education Assistant - Added by setup script`nInclude $(Get-Location)\.vscode\ssh_config`n"
        Add-Content -Path $SSHConfig -Value $IncludeLine
        Write-Status "Added project SSH config to main SSH config"
    }
    else {
        Write-Warning "SSH config already contains ebars-prod host"
    }
    
    return @{
        Host = $ServerHost
        User = $ServerUser
        Port = $ServerPort
    }
}

# Function to copy public key to server
function Copy-PublicKey {
    param([string]$KeyPath)
    
    $PublicKeyPath = "$KeyPath.pub"
    
    if (!(Test-Path $PublicKeyPath)) {
        Write-Error "Public key not found at $PublicKeyPath"
        throw "Public key not found"
    }
    
    $PublicKey = Get-Content $PublicKeyPath -Raw
    
    Write-Info "Your public key:"
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Write-Host $PublicKey -ForegroundColor White
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    Write-Info "Copy the above public key to your server's ~/.ssh/authorized_keys file"
    Write-Info "You can do this by running the following command on your server:"
    Write-Host ""
    Write-Host "mkdir -p ~/.ssh && echo '$PublicKey' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh" -ForegroundColor Cyan
    Write-Host ""
    
    Read-Host "Press Enter after you've added the key to your server"
}

# Function to test SSH connection
function Test-SSHConnection {
    Write-Info "Testing SSH connection..."
    
    try {
        $Process = Start-Process -FilePath "ssh" -ArgumentList @("-F", ".vscode\ssh_config", "-o", "ConnectTimeout=10", "ebars-prod", "echo 'SSH connection successful!'") -Wait -PassThru -NoNewWindow -RedirectStandardOutput "ssh_test_output.txt" -RedirectStandardError "ssh_test_error.txt"
        
        if ($Process.ExitCode -eq 0) {
            $Output = Get-Content "ssh_test_output.txt" -Raw
            if ($Output -match "SSH connection successful!") {
                Write-Status "SSH connection test successful!"
                Remove-Item "ssh_test_output.txt", "ssh_test_error.txt" -ErrorAction SilentlyContinue
                return $true
            }
        }
        
        Write-Error "SSH connection test failed!"
        if (Test-Path "ssh_test_error.txt") {
            $ErrorOutput = Get-Content "ssh_test_error.txt" -Raw
            Write-Host $ErrorOutput -ForegroundColor Red
        }
        
        Write-Info "Please check:"
        Write-Info "1. Server IP/domain is correct"
        Write-Info "2. SSH port is correct"
        Write-Info "3. Username is correct"
        Write-Info "4. Public key is added to server's authorized_keys"
        Write-Info "5. Server SSH service is running"
        
        Remove-Item "ssh_test_output.txt", "ssh_test_error.txt" -ErrorAction SilentlyContinue
        return $false
    }
    catch {
        Write-Error "SSH connection test failed with error: $($_.Exception.Message)"
        return $false
    }
}

# Function to setup VS Code extensions
function Install-VSCodeExtensions {
    Write-Info "Setting up VS Code extensions..."
    
    # Check if code command is available
    try {
        $CodeVersion = & code --version 2>$null
        if ($CodeVersion) {
            Write-Info "Installing Remote-SSH extension..."
            & code --install-extension ms-vscode-remote.remote-ssh
            & code --install-extension ms-vscode-remote.remote-ssh-edit
            & code --install-extension ms-vscode-remote.remote-containers
            & code --install-extension ms-vscode-remote.vscode-remote-extensionpack
            Write-Status "VS Code extensions installed!"
        }
    }
    catch {
        Write-Warning "VS Code 'code' command not found in PATH"
        Write-Info "Please install the following extensions manually:"
        Write-Info "- Remote - SSH"
        Write-Info "- Remote - SSH: Editing Configuration Files"
        Write-Info "- Remote - Containers"
        Write-Info "- Remote Development Extension Pack"
    }
}

# Function to create workspace file
function New-Workspace {
    param([string]$ServerUser)
    
    $WorkspaceFile = "ebars-remote.code-workspace"
    
    $WorkspaceContent = @"
{
    "folders": [
        {
            "name": "RAG Education Assistant",
            "uri": "vscode-remote://ssh-remote+ebars-prod/home/$ServerUser/ebars"
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
"@
    
    Set-Content -Path $WorkspaceFile -Value $WorkspaceContent
    Write-Status "Created VS Code workspace file: $WorkspaceFile"
}

# Main setup process
function Main {
    Write-Host ""
    Write-Info "Starting SSH setup for VS Code Remote Development..."
    Write-Host ""
    
    try {
        # Step 1: Generate SSH key
        Write-Info "Step 1: SSH Key Generation"
        $KeyPath = New-SSHKey
        Write-Host ""
        
        # Step 2: Setup SSH config
        Write-Info "Step 2: SSH Configuration"
        $ServerConfig = Set-SSHConfig -ServerHost $ServerHost -ServerUser $ServerUser -ServerPort $ServerPort
        Write-Host ""
        
        # Step 3: Copy public key to server
        Write-Info "Step 3: Copy Public Key to Server"
        Copy-PublicKey -KeyPath $KeyPath
        Write-Host ""
        
        # Step 4: Test SSH connection
        Write-Info "Step 4: Test SSH Connection"
        if (Test-SSHConnection) {
            Write-Host ""
            
            # Step 5: Setup VS Code extensions
            Write-Info "Step 5: VS Code Extensions"
            Install-VSCodeExtensions
            Write-Host ""
            
            # Step 6: Create workspace
            Write-Info "Step 6: Create VS Code Workspace"
            New-Workspace -ServerUser $ServerConfig.User
            Write-Host ""
            
            Write-Status "🎉 SSH setup completed successfully!"
            Write-Host ""
            Write-Info "Next steps:"
            Write-Info "1. Open VS Code"
            Write-Info "2. Open the workspace file: ebars-remote.code-workspace"
            Write-Info "3. Or use Ctrl+Shift+P -> 'Remote-SSH: Connect to Host' -> 'ebars-prod'"
            Write-Info "4. VS Code will automatically install the VS Code Server on the remote machine"
            Write-Host ""
            Write-Info "Useful commands:"
            Write-Info "- Test connection: ssh -F .vscode\ssh_config ebars-prod"
            Write-Info "- View logs: ssh -F .vscode\ssh_config ebars-prod 'cd ~/ebars && docker-compose logs -f'"
            Write-Info "- Deploy: ssh -F .vscode\ssh_config ebars-prod 'cd ~/ebars && ./scripts/deploy-prod.sh'"
        }
        else {
            Write-Error "Setup incomplete due to SSH connection failure"
            Write-Info "Please fix the connection issues and run the script again"
            exit 1
        }
    }
    catch {
        Write-Error "Setup failed: $($_.Exception.Message)"
        exit 1
    }
}

# Run main function
Main