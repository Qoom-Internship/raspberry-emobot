// import nodejs bindings to native tensorflow,
// not required, but will speed up things drastically (python required)
require('@tensorflow/tfjs-node');

const faceapi = require('face-api.js');
const NodeWebcam = require('node-webcam');
const fs = require('fs');
const path = require('path');

// implements nodejs wrappers for HTMLCanvasElement, HTMLImageElement, ImageData
const canvas = require('canvas');

// patch nodejs environment, we need to provide an implementation of
// HTMLCanvasElement and HTMLImageElement
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Face detection configuration
const faceDetectionNet = faceapi.nets.ssdMobilenetv1;
const minConfidence = 0.5;

function getFaceDetectorOptions(net) {
  return net === faceapi.nets.ssdMobilenetv1
    ? new faceapi.SsdMobilenetv1Options({ minConfidence })
    : new faceapi.TinyFaceDetectorOptions({ inputSize: 408, scoreThreshold: 0.5 });
}

const faceDetectionOptions = getFaceDetectorOptions(faceDetectionNet);

// Save file utility
function saveFile(fileName, buf) {
  const baseDir = path.resolve(__dirname, 'out');
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir);
  }
  fs.writeFileSync(path.resolve(baseDir, fileName), buf);
}

// Configure webcam options
const webcamOptions = {
  width: 1280,
  height: 720,
  quality: 100,
  delay: 0,
  saveShots: true,
  output: "jpeg",
  device: "/dev/video2", // use camera on video0 device
  callbackReturn: "location",
  verbose: false,
  
  // Camera controls for better image quality
  setValues: {
    brightness: 10,        // Increase brightness (-50 to 50, default: 0)
    contrast: 10,          // Increase contrast (-50 to 50, default: 0)
    saturation: 5,         // Slightly boost saturation (-50 to 50, default: 0)
    exposure_auto: 1,      // Auto exposure (1 = auto, 3 = manual)
    exposure_absolute: 200 // Manual exposure value (higher = brighter, try 100-400)
  }
};

async function captureFromWebcam() {
  return new Promise((resolve, reject) => {
    console.log('Capturing image from webcam...');
    
    // Create webcam instance
    const webcam = NodeWebcam.create(webcamOptions);
    
    // Capture image
    const timestamp = Date.now();
    const filename = `webcam_capture_${timestamp}`;
    
    webcam.capture(filename, (err, data) => {
      if (err) {
        reject(new Error(`Failed to capture image: ${err.message}`));
      } else {
        console.log(`Image captured: ${data}`);
        resolve(data);
      }
    });
  });
}

async function detectFacesInImage(imagePath) {
  console.log('Loading image for face detection...');
  
  // Load the captured image
  const img = await canvas.loadImage(imagePath);
  console.log(`Image loaded: ${img.width}x${img.height}`);
  
  // Detect all faces in the image
  console.log('Detecting faces...');
  const detections = await faceapi.detectAllFaces(img, faceDetectionOptions);
  console.log(`Found ${detections.length} face(s)`);
  
  return { img, detections };
}

async function drawFaceDetections(img, detections) {
  console.log('Drawing face detection results...');
  
  // Create canvas from the image
  const out = faceapi.createCanvasFromMedia(img);
  
  // Draw detection rectangles
  faceapi.draw.drawDetections(out, detections);
  
  // Add some styling to make the rectangles more visible
  const ctx = out.getContext('2d');
  
  // Draw additional info for each detection
  detections.forEach((detection, index) => {
    const { x, y, width, height } = detection.box;
    const confidence = Math.round(detection.score * 100);
    
    // Set text properties
    ctx.font = '16px Arial';
    ctx.fillStyle = 'red';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    
    // Draw confidence text
    const text = `Face ${index + 1}: ${confidence}%`;
    const textMetrics = ctx.measureText(text);
    const textX = x;
    const textY = y > 20 ? y - 5 : y + height + 20;
    
    // Draw text background
    ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
    ctx.fillRect(textX, textY - 16, textMetrics.width + 10, 20);
    
    // Draw text
    ctx.fillStyle = 'white';
    ctx.fillText(text, textX + 5, textY - 2);
  });
  
  return out;
}

async function run() {
  try {
    console.log('=== Webcam Face Detection Script ===');
    console.log('Loading face detection model...');
    
    // Load the face detection model from local models directory
    await faceDetectionNet.loadFromUri('./models');
    console.log('Face detection model loaded successfully!');
    
    // Capture image from webcam
    const capturedImagePath = await captureFromWebcam();
    
    // Detect faces in the captured image
    const { img, detections } = await detectFacesInImage(capturedImagePath);
    
    if (detections.length === 0) {
      console.log('No faces detected in the captured image.');
      console.log('Make sure you are visible in the camera when the image is captured.');
    } else {
      // Draw face detection results
      const canvasResult = await drawFaceDetections(img, detections);
      
      // Save the result
      const timestamp = Date.now();
      const outputFileName = `webcam_face_detection_${timestamp}.jpg`;
      saveFile(outputFileName, canvasResult.toBuffer('image/jpeg'));
      
      console.log(`\n=== Results ===`);
      console.log(`Faces detected: ${detections.length}`);
      console.log(`Original image: ${capturedImagePath}`);
      console.log(`Result saved to: out/${outputFileName}`);
      
      // Print details about each detection
      detections.forEach((detection, index) => {
        const { x, y, width, height } = detection.box;
        const confidence = Math.round(detection.score * 100);
        console.log(`Face ${index + 1}: Position(${Math.round(x)}, ${Math.round(y)}) Size(${Math.round(width)}x${Math.round(height)}) Confidence: ${confidence}%`);
      });
    }
    
    console.log('\n=== Webcam Face Detection Complete ===');
    
  } catch (error) {
    console.error('Error during face detection:', error.message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Make sure your webcam is connected and working');
    console.error('2. Ensure you have the required system dependencies:');
    console.error('   - Linux: sudo apt-get install fswebcam');
    console.error('   - macOS: brew install imagesnap');
    console.error('   - Windows: included automatically');
    console.error('3. Make sure the model files are accessible');
    console.error('4. Try running from the examples/examples-nodejs directory');
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