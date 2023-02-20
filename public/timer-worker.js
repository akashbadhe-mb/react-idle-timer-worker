let timer;
let timeOutInterval = 4000;
let countDownOutInterval = 10;
let countDownTimer;
let lastInteractionTime;

const startTimer = () => {
  if (timer) {
    clearInterval(timer);
    clearInterval(countDownTimer);
  }
  timer = setInterval(() => {
    postMessage(`updateLastInteractionTime`);
    const currentTime = new Date().valueOf();
    const diff = currentTime - (+lastInteractionTime);
    if (diff > timeOutInterval) {
      postMessage("onIdle");
      createCountDown();
    }
  }, 60000);
};

const createCountDown = () => {
  if (countDownTimer) {
    clearInterval(countDownTimer);
  }
  if (timer) {
    clearInterval(timer);
  }
  let countTimer = countDownOutInterval;
  countDownTimer = setInterval(() => {
    let minutes = parseInt(countTimer / 60, 10);
    let seconds = parseInt(countTimer % 60, 10);

    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    postMessage(`countDown:${minutes + ":" + seconds}`);
    if (--countTimer < 0) {
      clearInterval(countDownTimer);
      postMessage('countDownCompleted');
    }
  }, 1000);
}

onmessage = (e) => {
  if (e.data.key === 'startTimer') {
    postMessage("onActive");
    lastInteractionTime = e.data.value || new Date().valueOf();
    startTimer();
  }
  if (e.data.key === 'userInteracted') {
    postMessage("onActive");
    lastInteractionTime = new Date().valueOf();
    startTimer();
  } else if (e.data.key === 'timeOutInterval') {
    timeOutInterval = e.data.value * 1000;
  } else if (e.data.key === 'countDownOutInterval') {
    countDownOutInterval = e.data.value;
  } else if (e.data.key === 'lastInteractionTimeUpdated') {
    lastInteractionTime = e.data.value || new Date().valueOf();
  }
};