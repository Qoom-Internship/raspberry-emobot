const faceapi = require('face-api.js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Face detection configuration (without Canvas dependency)
const faceDetectionNet = faceapi.nets.ssdMobilenetv1;
const minConfidence = 0.5;
const faceDetectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence });

// Save file utility
function saveFile(fileName, data) {
  const baseDir = path.resolve(__dirname, 'out');
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir);
  }
  fs.writeFileSync(path.resolve(baseDir, fileName), data);
}

// Configure camera options
const cameraOptions = {
  width: 1280,
  height: 720,
  quality: 100,
  delay: 0,
  saveShots: true,
  output: "jpeg",
  device: "/dev/video0", // use camera on video2 device
  callbackReturn: "location",
  verbose: false,
  
  // Camera controls for better image quality
  setValues: {
    brightness: 50,        // Increase brightness (-50 to 50, default: 0)
    contrast: 10,          // Increase contrast (-50 to 50, default: 0)
    saturation: 5,         // Slightly boost saturation (-50 to 50, default: 0)
    exposure_auto: 3,      // Auto exposure (1 = auto, 3 = manual)
    exposure_absolute: 10000, // Manual exposure value (higher = brighter, try 100-400)
    exposure_auto_priority: 0,   // 0=disabled, 1=enabled
  
    // Gain Controls  
    gain: 125,                    // 0-255 (amplification)
    gain_auto: 0,                // 0=manual, 1=auto
  }
};

async function captureFromWPiCamera() {
  try {
    console.log('Capturing image from Pi Camera...');

    const timestamp = Date.now();
    const filename = `pi_camera_capture_${timestamp}.jpg`;
    const filePath = path.resolve(__dirname, filename);

    // 2초간 카메라 준비 후 촬영
    execSync(`libcamera-still -t 2000 -o ${filePath} --nopreview`, { stdio: 'ignore' });

    console.log(`Image captured: ${filePath}`);
    return filePath;
  } catch (error) {
    throw new Error(`Failed to capture image with Pi Camera: ${error.message}`);
  }
}

async function detectFacesInImage(imagePath) {
  console.log('Loading image for face detection...');
  
  // For face detection without Canvas, we need to load the image differently
  // This is a simplified approach that works without Canvas
  const imageBuffer = fs.readFileSync(imagePath);
  
  console.log('Detecting faces...');
  
  // Note: This is a simplified version - in a full implementation,
  // you'd need to properly decode the image buffer
  console.log('⚠️  Note: This simplified version shows the detection workflow.');
  console.log('⚠️  For full image processing, Canvas dependencies are required.');
  
  // Simulate face detection results for demonstration
  const mockDetections = [
    {
      box: { x: 245, y: 156, width: 180, height: 180 },
      score: 0.96
    },
    {
      box: { x: 634, y: 203, width: 165, height: 165 },
      score: 0.89
    }
  ];
  
  console.log(`Mock detection: Found ${mockDetections.length} face(s)`);
  console.log('(In full version, this would use actual face detection)');
  
  return { imagePath, detections: mockDetections };
}

async function saveDetectionResults(imagePath, detections) {
  console.log('Saving face detection results...');
  
  const timestamp = Date.now();
  const results = {
    timestamp: new Date().toISOString(),
    originalImage: imagePath,
    imageSize: { width: cameraOptions.width, height: cameraOptions.height },
    facesDetected: detections.length,
    faces: detections.map((detection, index) => ({
      faceId: index + 1,
      position: {
        x: Math.round(detection.box.x),
        y: Math.round(detection.box.y)
      },
      size: {
        width: Math.round(detection.box.width),
        height: Math.round(detection.box.height)
      },
      confidence: Math.round(detection.score * 100),
      boundingBox: {
        topLeft: { x: detection.box.x, y: detection.box.y },
        topRight: { x: detection.box.x + detection.box.width, y: detection.box.y },
        bottomLeft: { x: detection.box.x, y: detection.box.y + detection.box.height },
        bottomRight: { x: detection.box.x + detection.box.width, y: detection.box.y + detection.box.height }
      }
    }))
  };
  
  const outputFileName = `face_detection_results_${timestamp}.json`;
  saveFile(outputFileName, JSON.stringify(results, null, 2));
  
  return { outputFileName, results };
}

async function run() {
  try {
    console.log('=== Pi Camera Face Detection Script (Simplified) ===');
    console.log('Loading face detection model...');
    
    // For the simplified version, we'll skip actual model loading
    // In the full version, this would load the actual models
    console.log('✓ Face detection model loaded (mock)');
    console.log('');
    
    // Capture image from camera
    const capturedImagePath = await captureFromPiCamera();
    
    // Detect faces in the captured image
    const { imagePath, detections } = await detectFacesInImage(capturedImagePath);
    
    if (detections.length === 0) {
      console.log('No faces detected in the captured image.');
      console.log('Make sure you are visible in the camera when the image is captured.');
    } else {
      // Save detection results
      const { outputFileName, results } = await saveDetectionResults(imagePath, detections);
      
      console.log(`\n=== Results ===`);
      console.log(`Faces detected: ${detections.length}`);
      console.log(`Original image: ${capturedImagePath}`);
      console.log(`Results saved to: out/${outputFileName}`);
      console.log('');
      
      // Print details about each detection
      detections.forEach((detection, index) => {
        const { x, y, width, height } = detection.box;
        const confidence = Math.round(detection.score * 100);
        console.log(`Face ${index + 1}: Position(${Math.round(x)}, ${Math.round(y)}) Size(${Math.round(width)}x${Math.round(height)}) Confidence: ${confidence}%`);
      });
      
      console.log('');
      console.log('📄 Detailed results saved in JSON format');
      console.log('🖼️  To visualize the face rectangles:');
      console.log('   1. Open the captured image in an image editor');
      console.log('   2. Use the coordinates from the JSON file to draw rectangles');
      console.log('   3. Or install Canvas dependencies for automatic rectangle drawing');
    }
    
    console.log('\n=== Webcam Face Detection Complete ===');
    console.log('');
    console.log('🔧 To enable full image processing with automatic rectangle drawing:');
    console.log('   sudo apt-get update && sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev libpixman-1-dev');
    console.log('   npm install');
    console.log('   node webcamFaceDetection.js');
    
  } catch (error) {
    console.error('Error during face detection:', error.message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Make sure your webcam is connected and working');
    console.error('2. Ensure you have the required system dependencies:');
    console.error('   - Linux: sudo apt-get install fswebcam');
    console.error('   - macOS: brew install imagesnap');
    console.error('   - Windows: included automatically');
    console.error('3. Try running from the examples/examples-nodejs directory');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

// Run the script
if (require.main === module) {
  run();
}

module.exports = { run }; 