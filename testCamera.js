const NodeWebcam = require('node-webcam');

// Test different video devices (video2 is the preferred camera)
const testDevices = ['/dev/video2', '/dev/video0', '/dev/video1', '/dev/video3'];

async function testCameraDevice(device) {
  return new Promise((resolve) => {
    console.log(`\n🔍 Testing ${device}...`);
    
    const webcamOptions = {
      width: 640,
      height: 480,
      quality: 50,
      delay: 0,
      saveShots: false,
      output: "jpeg",
      device: device,
      callbackReturn: "location",
      verbose: true
    };

    const webcam = NodeWebcam.create(webcamOptions);
    const testFilename = `test_${device.replace('/dev/', '')}_${Date.now()}`;
    
    webcam.capture(testFilename, (err, data) => {
      if (err) {
        console.log(`❌ ${device}: ${err.message}`);
        resolve({ device, success: false, error: err.message });
      } else {
        console.log(`✅ ${device}: SUCCESS! Image saved to ${data}`);
        resolve({ device, success: true, imagePath: data });
      }
    });
  });
}

async function findWorkingCamera() {
  console.log('🎥 Camera Detection Test');
  console.log('========================');
  console.log('Testing all available video devices...\n');

  const results = [];
  
  for (const device of testDevices) {
    try {
      const result = await testCameraDevice(device);
      results.push(result);
      
      if (result.success) {
        console.log(`\n🎉 FOUND WORKING CAMERA: ${device}`);
        console.log(`📷 Test image saved: ${result.imagePath}`);
        break; // Found a working camera, stop testing
      }
    } catch (error) {
      console.log(`❌ ${device}: Unexpected error - ${error.message}`);
      results.push({ device, success: false, error: error.message });
    }
  }

  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  results.forEach(result => {
    const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
    console.log(`${result.device}: ${status}`);
    if (!result.success) {
      console.log(`   Error: ${result.error}`);
    }
  });

  const workingDevice = results.find(r => r.success);
  if (workingDevice) {
    console.log(`\n🔧 Use this device in your script:`);
    console.log(`   device: "${workingDevice.device}"`);
    return workingDevice.device;
  } else {
    console.log('\n❌ No working camera found. Check:');
    console.log('   1. Camera is plugged in and recognized by system');
    console.log('   2. No other application is using the camera');
    console.log('   3. You have permissions (run: groups $USER)');
    console.log('   4. Camera drivers are properly installed');
    return null;
  }
}

// Run the test
if (require.main === module) {
  findWorkingCamera().then(workingDevice => {
    if (workingDevice) {
      console.log(`\n✨ Ready to use camera: ${workingDevice}`);
    } else {
      console.log('\n🔧 Troubleshooting needed');
    }
  }).catch(error => {
    console.error('Test failed:', error);
  });
}

module.exports = { findWorkingCamera, testCameraDevice }; 