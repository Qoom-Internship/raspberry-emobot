const { execSync } = require('child_process');

// 감정 → GPIO 매핑
const emotionToGpio = {
  Angry: 17,     // 빨강
  Disgust: 22,   // 초록
  Fear: 18,      // 노랑
  Happy: 23,     // 파랑
  Sad: 27,       // 흰색
  Surprise: 18,  // 노랑 (Fear와 공유)
  Neutral: null  // 아무 것도 안 켬
};

// 모든 GPIO 핀
const allGpioPins = [17, 18, 22, 23, 27];

// LED 초기화 함수
function turnOffAll() {
  allGpioPins.forEach(pin => {
    execSync(`gpioset 0 ${pin}=0`);
  });
}

// 감정에 맞는 LED만 ON
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
