# Webcam Face Detection with face-api.js

This Node.js script captures an image from your webcam, detects all faces in the image using face-api.js, and creates an output image with rectangles drawn around each detected face.

## Features

- 📷 **Webcam Capture**: Automatically captures high-quality images from your default camera
- 🎯 **Face Detection**: Uses advanced machine learning models to detect faces with confidence scores
- 🖼️ **Visual Results**: Draws bounding boxes around detected faces with confidence percentages
- 💾 **Image Output**: Saves both the original captured image and the annotated result
- 🔧 **Cross-Platform**: Works on Linux, macOS, and Windows
- 📊 **Detailed Logging**: Provides comprehensive information about detection results

## Prerequisites

### System Dependencies

The script uses `node-webcam` which requires different system packages depending on your operating system:

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install fswebcam
```

#### Linux (Arch)
```bash
sudo pamac build fswebcam
```

#### macOS
```bash
brew install imagesnap
```

#### Windows
No additional installation required - the necessary executables are included with the `node-webcam` package.

### Node.js Dependencies

Install the required Node.js packages:

```bash
# Navigate to the examples/examples-nodejs directory
cd examples/examples-nodejs

# Install dependencies
npm install
```

## Installation & Setup

1. **Clone or download the face-api.js repository** (if you haven't already)

2. **Navigate to the examples directory**:
   ```bash
   cd face-api.js/examples/examples-nodejs
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Verify your webcam is working**:
   - Make sure your webcam is connected
   - Test it with your system's camera app to ensure it's functional
   - Close any other applications that might be using the camera

## Usage

### Basic Usage

Run the script from the `examples/examples-nodejs` directory:

```bash
node webcamFaceDetection.js
```

### What the Script Does

1. **Loads the face detection model** from the weights directory
2. **Captures an image** from your default webcam (1280x720 resolution)
3. **Processes the image** to detect all faces
4. **Draws rectangles** around each detected face with confidence scores
5. **Saves two files**:
   - Original captured image: `webcam_capture_[timestamp].jpg`
   - Annotated result: `out/webcam_face_detection_[timestamp].jpg`

### Expected Output

```
=== Webcam Face Detection Script ===
Loading face detection model...
Face detection model loaded successfully!
Capturing image from webcam...
Image captured: /path/to/webcam_capture_1699123456789.jpg
Loading image for face detection...
Image loaded: 1280x720
Detecting faces...
Found 2 face(s)
Drawing face detection results...

=== Results ===
Faces detected: 2
Original image: /path/to/webcam_capture_1699123456789.jpg
Result saved to: out/webcam_face_detection_1699123456789.jpg
Face 1: Position(245, 156) Size(180x180) Confidence: 96%
Face 2: Position(634, 203) Size(165x165) Confidence: 89%

=== Webcam Face Detection Complete ===
```

## Output Files

The script creates two types of output files:

### 1. Original Captured Image
- **Location**: Same directory as the script
- **Filename**: `webcam_capture_[timestamp].jpg`
- **Content**: Raw image captured from your webcam

### 2. Annotated Result Image
- **Location**: `out/` subdirectory
- **Filename**: `webcam_face_detection_[timestamp].jpg`
- **Content**: Original image with:
  - Red rectangles around detected faces
  - Confidence scores displayed as percentages
  - Face numbering for easy identification

## Configuration Options

You can modify the webcam settings by editing the `webcamOptions` object in the script:

```javascript
const webcamOptions = {
  width: 1280,        // Image width in pixels
  height: 720,        // Image height in pixels
  quality: 100,       // JPEG quality (0-100)
  delay: 0,           // Delay before capture (seconds)
  saveShots: true,    // Save intermediate files
  output: "jpeg",     // Output format
  device: false,      // Camera device (false = default)
  callbackReturn: "location", // Return type
  verbose: false      // Enable debug output
};
```

### Face Detection Settings

The script uses the SSD MobileNet v1 model with these default settings:
- **Minimum Confidence**: 0.5 (50%)
- **Model**: SSD MobileNet v1 (balanced speed and accuracy)

To change the detection model or settings, modify the configuration in `commons/faceDetection.ts`.

## Troubleshooting

### Common Issues

#### 1. "Failed to capture image" Error
**Possible causes:**
- Webcam is not connected or not working
- Another application is using the camera
- Missing system dependencies

**Solutions:**
- Test your camera with the system's default camera app
- Close other applications that might be using the camera
- Install the required system dependencies (see Prerequisites)

#### 2. "No faces detected" Message
**Possible causes:**
- Poor lighting conditions
- Face not clearly visible in the camera
- Face too small or too far from camera

**Solutions:**
- Ensure good lighting on your face
- Position yourself clearly in front of the camera
- Move closer to the camera
- Try capturing again with better positioning

#### 3. Permission Denied Errors
**On Linux/macOS:**
```bash
# Make sure your user has access to video devices
sudo usermod -a -G video $USER
# Log out and log back in
```

#### 4. Model Loading Errors
**Ensure the weights directory exists:**
```bash
# From the face-api.js root directory
ls -la weights/
```
The weights directory should contain the pre-trained model files.

### Debug Mode

To enable verbose output from the webcam capture:

```javascript
const webcamOptions = {
  // ... other options
  verbose: true
};
```

### Testing Camera Access

You can test if your camera is accessible:

#### Linux
```bash
ls /dev/video*
fswebcam test.jpg
```

#### macOS
```bash
imagesnap test.jpg
```

#### Windows
Use the built-in Camera app to verify functionality.

## Advanced Usage

### Multiple Cameras

To use a specific camera device:

```javascript
// First, list available cameras
const NodeWebcam = require('node-webcam');
NodeWebcam.list(function(list) {
  console.log('Available cameras:', list);
  
  // Use a specific camera
  const webcamOptions = {
    // ... other options
    device: list[1] // Use second camera
  };
});
```

### Custom Output Directory

Modify the `saveFile` function call to specify a custom output directory:

```javascript
const outputPath = path.join(__dirname, 'my-custom-output', outputFileName);
saveFile(outputFileName, canvas.toBuffer('image/jpeg'));
```

### Integration with Other Scripts

The script exports its main function for use in other Node.js applications:

```javascript
const { run } = require('./webcamFaceDetection');

// Use in your own application
run().then(() => {
  console.log('Face detection completed');
}).catch(error => {
  console.error('Error:', error);
});
```

## Performance Tips

1. **Good Lighting**: Ensure your face is well-lit for better detection accuracy
2. **Camera Position**: Position the camera at eye level for optimal face detection
3. **Stable Connection**: Use a USB camera with a stable connection for better image quality
4. **Close Other Apps**: Close other applications using the camera to avoid conflicts

## Contributing

If you encounter issues or have suggestions for improvements:

1. Check the existing issues in the face-api.js repository
2. Create a detailed bug report with:
   - Your operating system
   - Node.js version
   - Error messages (if any)
   - Steps to reproduce the issue

## License

This script is part of the face-api.js project and follows the same MIT license terms. 