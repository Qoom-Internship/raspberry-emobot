echo "Setting up Emotion Detection on Raspberry Pi..."

# Create models directory
mkdir -p models

# Download Haar cascade if not exists
if [ ! -f "models/haarcascade_frontalface_default.xml" ]; then
    echo "Downloading Haar cascade..."
    curl -o models/haarcascade_frontalface_default.xml \
        "https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml"
    
    if [ $? -eq 0 ]; then
        echo "Haar cascade downloaded successfully"
    else
        echo "Failed to download Haar cascade. Please download manually."
        exit 1
    fi
fi

# Install npm dependencies
echo "Installing npm dependencies..."
npm install

echo "Setup complete!"
echo "Run: node emotion-detector.js"
echo "Or: node emotion-detector.js --realtime"