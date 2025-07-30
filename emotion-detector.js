const cv = require('opencv.js');
const fs = require('fs-extra');
const NodeWebcam = require('node-webcam');
const sharp = require('sharp');
const path = require('path');
const setEmotionLed = require('./led_control');

const { execSync } = require('child_process');

class EmotionDetector {
    constructor() {
        this.faceCascade = null;
        this.emotionLabels = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral'];
        this.isInitialized = false;
        
        this.webcamOpts = {
            width: 640,
            height: 480,
            quality: 100,
            delay: 0,
            saveShots: true,
            output: "jpeg",
            device: false,
            callbackReturn: "location",
            verbose: false
        };
        
        this.webcam = NodeWebcam.create(this.webcamOpts);
    }

    async initialize() {
        try {
            console.log('Initializing OpenCV.js...');
            
            // Wait for OpenCV to be ready
            await this.waitForOpenCV();
            
            // Load face cascade
            await this.loadFaceCascade();
            
            console.log('OpenCV.js initialized successfully!');
            this.isInitialized = true;
            
            return true;
        } catch (error) {
            console.error('Failed to initialize:', error);
            return false;
        }
    }

    async waitForOpenCV() {
        return new Promise((resolve) => {
            if (cv.getBuildInformation) {
                console.log('OpenCV.js is ready');
                resolve();
            } else {
                // If OpenCV is not ready, wait a bit and try again
                setTimeout(() => this.waitForOpenCV().then(resolve), 100);
            }
        });
    }

    async loadFaceCascade() {
        try {
            console.log('Loading face cascade for OpenCV.js...');

            this.faceCascade = new cv.CascadeClassifier();

            const cascadeFile = 'haarcascade_frontalface_default.xml';

            try {
                this.faceCascade.load(cascadeFile);
                
                if (this.faceCascade.empty()) {
                    throw new Error('Cascade is empty after loading');
                }
                
                console.log('Face cascade loaded successfully');
                return;
                
            } catch (loadError) {
                console.log('Built-in cascade loading failed, trying alternative method...');
                
                await this.loadCascadeFromFile();
            }
            
        } catch (error) {
            console.error('Error loading face cascade:', error);
            throw new Error('Failed to load face cascade');
        }
    }

    async loadCascadeFromFile() {
        const cascadePath = path.join(__dirname, 'models', 'haarcascade_frontalface_default.xml');
        
        try {
            if (!await fs.pathExists(cascadePath)) {
                await this.downloadHaarCascade(cascadePath);
            }
            
            const cascadeData = await fs.readFile(cascadePath, 'utf8');

            console.log('Using alternative face detection method...');
            this.faceCascade = null;
            
        } catch (error) {
            console.error('Failed to load cascade from file:', error);
            throw error;
        }
    }

    async downloadHaarCascade(cascadePath) {
        try {
            console.log('Downloading Haar cascade file...');
            await fs.ensureDir(path.dirname(cascadePath));
            
            const { exec } = require('child_process');
            const util = require('util');
            const execPromise = util.promisify(exec);
            
            const url = 'https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml';
            
            await execPromise(`curl -o "${cascadePath}" "${url}"`);
            
            if (!await fs.pathExists(cascadePath)) {
                throw new Error('Failed to download cascade file');
            }
            
            console.log('Haar cascade downloaded successfully');
            
        } catch (error) {
            console.error('Download failed:', error);
            throw error;
        }
    }

    async captureImage(outputPath = 'capture.jpg') {
        try {
            const command = `libcamera-still -o ${outputPath} --nopreview --timeout 1000 --width 640 --height 480`;
            await execSync(command);
            console.log(`Image captured: ${outputPath}`);
            return outputPath;
        } catch (error) {
            console.error('Error capturing image:', error.message);
            throw error;
        }
    }

    async processImage(imagePath) {
        let src = null;
        let gray = null;
        
        try {
            console.log('Processing image:', imagePath);
            
            if (!await fs.pathExists(imagePath)) {
                throw new Error(`Image file not found: ${imagePath}`);
            }
            
            const imageBuffer = await sharp(imagePath)
                .ensureAlpha()
                .raw()
                .toBuffer({ resolveWithObject: true });
            
            const { data, info } = imageBuffer;
            
            console.log('Image loaded:', info);
            
            src = cv.matFromImageData({
                data: new Uint8ClampedArray(data),
                width: info.width,
                height: info.height
            });
            
            if (src.empty()) {
                throw new Error('Failed to create source image matrix');
            }
            
            gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            
            if (gray.empty()) {
                throw new Error('Failed to convert to grayscale');
            }
            
            console.log('Image converted to grayscale');
            
            const faces = await this.detectFaces(gray);
            
            const results = [];
            
            faces.forEach((face, index) => {
                console.log(`Processing face ${index + 1}:`, face);
                
                const emotion = this.predictEmotion();
                
                results.push({
                    x: face.x,
                    y: face.y,
                    width: face.width,
                    height: face.height,
                    emotion: emotion
                });
            });
            
            return results;
            
        } catch (error) {
            console.error('Error processing image:', error);
            return [];
        } finally {
            // Clean up
            if (src) src.delete();
            if (gray) gray.delete();
        }
    }

    async detectFaces(grayMat) {
        try {
            if (this.faceCascade && !this.faceCascade.empty()) {

                const faces = new cv.RectVector();
                
                this.faceCascade.detectMultiScale(
                    grayMat,
                    faces,
                    1.1,
                    3,
                    0,
                    new cv.Size(30, 30)
                );
                
                const results = [];
                for (let i = 0; i < faces.size(); i++) {
                    const face = faces.get(i);
                    results.push({
                        x: face.x,
                        y: face.y,
                        width: face.width,
                        height: face.height
                    });
                }
                
                faces.delete();
                return results;
                
            } else {
                console.log('Using alternative face detection...');
                return await this.alternativeFaceDetection(grayMat);
            }
            
        } catch (error) {
            console.error('Face detection error:', error);
            return [];
        }
    }

    async alternativeFaceDetection(grayMat) {
        try {
            const thresh = new cv.Mat();
            cv.threshold(grayMat, thresh, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
            
            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();
            
            cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
            
            const faces = [];
            
            for (let i = 0; i < contours.size(); i++) {
                const contour = contours.get(i);
                const rect = cv.boundingRect(contour);
                
                if (rect.width > 50 && rect.height > 50 && 
                    rect.width < grayMat.cols * 0.8 && rect.height < grayMat.rows * 0.8) {
                    
                    const aspectRatio = rect.width / rect.height;
                    if (aspectRatio > 0.6 && aspectRatio < 1.4) {
                        faces.push(rect);
                    }
                }
                
                contour.delete();
            }
            
            thresh.delete();
            contours.delete();
            hierarchy.delete();
            
            return faces;
            
        } catch (error) {
            console.error('Alternative detection error:', error);
            return [];
        }
    }

    predictEmotion() {
        const emotions = ['Happy', 'Sad', 'Angry', 'Surprise', 'Fear', 'Disgust', 'Neutral'];
        return emotions[Math.floor(Math.random() * emotions.length)];
    }

    async detectEmotions() {
        if (!this.isInitialized) {
            console.error('Detector not initialized');
            return [];
        }

        let imagePath = null;

        try {
            console.log('Capturing image...');
            imagePath = await this.captureImage();
            console.log('Image captured:', imagePath);

            console.log('Processing image for emotions...');
            const results = await this.processImage(imagePath);

            if (results.length > 0) {
            const primaryEmotion = results[0].emotion;
            setEmotionLed(primaryEmotion);
            } else {
            setEmotionLed('Neutral');
            }

            return results;

        } catch (error) {
            console.error('Error detecting emotions:', error);
            setEmotionLed('Neutral');
            return [];
        } finally {
            if (imagePath && await fs.pathExists(imagePath)) {
            // await fs.remove(imagePath); // 선택적으로 삭제
            }
        }
    }

    async startRealTimeDetection(intervalMs = 10000) {
        console.log('Starting real-time emotion detection...');
        console.log(`Interval: ${intervalMs / 1000} seconds`);
        console.log('Press Ctrl+C to stop\n');

        const loop = async () => {
            try {
            const results = await this.detectEmotions();

            if (results.length > 0) {
                const primaryEmotion = results[0].emotion;
                setEmotionLed(primaryEmotion);
            } else {
                setEmotionLed('Neutral');
            }

            } catch (error) {
            console.error('Error during detection loop:', error);
            setEmotionLed('Neutral');
            }

            setTimeout(loop, intervalMs);
        };

        await loop();
    }

}

async function main() {
  const detector = new EmotionDetector();

  console.log('Initializing emotion detector...');
  const initialized = await detector.initialize();

  if (!initialized) {
    console.error('Failed to initialize emotion detector');
    process.exit(1);
  }

  await detector.startRealTimeDetection(10000);
}

process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    process.exit(0);
});

if (require.main === module) {
    main().catch(console.error);
}

module.exports = EmotionDetector;