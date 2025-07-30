const { execSync } = require('child_process');

const emotionToGpio = {
  Angry: 17,
  Disgust: 22,
  Fear: 18,
  Happy: 23,
  Sad: 27, 
  Surprise: 18,
  Neutral: null
};

const allGpioPins = [17, 18, 22, 23, 27];

function turnOffAll() {
  allGpioPins.forEach(pin => {
    execSync(`gpioset 0 ${pin}=0`);
  });
}

function setEmotionLed(emotion) {
  console.log(`감정 인식 결과: ${emotion}`);

  turnOffAll();

  const pin = emotionToGpio[emotion];
  if (pin !== null && pin !== undefined) {
    execSync(`gpioset 0 ${pin}=1`);
    console.log(`GPIO ${pin} (LED) ON`);
  } else {
    console.log('Neutral 감정 → 모든 LED OFF');
  }
}

// 예시 실행 (테스트용)
if (require.main === module) {
  const testEmotion = process.argv[2] || 'Happy';
  setEmotionLed(testEmotion);

  // 3초 후 OFF
  setTimeout(() => {
    turnOffAll();
    console.log('LED OFF');
  }, 3000);
}

module.exports = setEmotionLed;
