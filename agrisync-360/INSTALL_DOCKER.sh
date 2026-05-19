#!/bin/bash

echo "🐳 Installing Docker for AgriSync 360"
echo "====================================="

# Install Docker
sudo apt update
sudo apt install -y docker.io docker-compose

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose (if not already installed)
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

echo "✅ Docker installation complete!"
echo "🔄 Please log out and log back in for docker group changes to take effect"
echo "Then run: cd /home/stevemburu/Development/Agrisync360/agrisync-360 && docker-compose up -d postgres redis backend"
