let audioCtx = null;
let fallbackSource = null;
let fallbackGain = null;

onload = () => {
  // use pointerdown for touch support; keep handler once to satisfy mobile gesture
  document.body.addEventListener('pointerdown', (ev) => {
    document.body.classList.remove("container");
    hideInitialText();
    startTextAnimation();

    // attempt robust audio start (HTMLAudio first, fallback to WebAudio if blocked)
    tryPlayAudio();
  }, { once: true });

  // no visible music toggle — audio controlled only by initial gesture
};

// Play background music (called after user gesture)
function playMusic() {
  const bgMusic = document.getElementById('bgMusic');
  if (!bgMusic) return;
  bgMusic.volume = 0.6;
  bgMusic.play().then(() => {
    // played
  }).catch(err => {
    console.log('Audio play blocked:', err);
  });
}

// Try playing audio robustly: first unmute + play HTMLAudio, then fallback to AudioContext decoding
async function tryPlayAudio() {
  const bg = document.getElementById('bgMusic');
  if (!bg) return;

  try {
    // Chrome Android allows muted audio to autoplay; unmute + play on gesture
    bg.muted = false;
    bg.volume = 0.6;
    await bg.play();
    console.log('Audio playing via HTMLAudio element');
    return;
  } catch (err) {
    // HTMLAudio.play() blocked — try WebAudio fallback
    console.log('HTMLAudio play failed, trying WebAudio fallback:', err);
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') await audioCtx.resume();

      // if we already have a fallbackSource playing, skip
      if (fallbackSource) {
        console.log('Fallback already playing');
        return;
      }

      // fetch and decode audio data
      const audioSrc = bg.getAttribute('src');
      const resp = await fetch(audioSrc, { mode: 'cors' });
      const arr = await resp.arrayBuffer();
      const buf = await audioCtx.decodeAudioData(arr);

      fallbackSource = audioCtx.createBufferSource();
      fallbackSource.buffer = buf;
      fallbackSource.loop = true;
      fallbackGain = audioCtx.createGain();
      fallbackGain.gain.value = 0.6;
      fallbackSource.connect(fallbackGain).connect(audioCtx.destination);
      fallbackSource.start(0);
      console.log('Audio playing via WebAudio fallback');
    } catch (e) {
      console.log('WebAudio fallback also failed', e);
      showAudioToast('Ketuk layar lagi untuk memutar musik');
      // set a one-time retry on next gesture
      const retry = () => { 
        tryPlayAudio(); 
        document.body.removeEventListener('pointerdown', retry); 
        hideAudioToast(); 
      };
      document.body.addEventListener('pointerdown', retry, { once: true });
    }
  }
}

// Small toast message to request another tap if audio is blocked
function showAudioToast(message) {
  hideAudioToast();
  const d = document.createElement('div');
  d.className = 'audio-toast';
  d.textContent = message;
  document.body.appendChild(d);
}

function hideAudioToast() {
  const existing = document.querySelector('.audio-toast');
  if (existing) existing.remove();
}

// Hide initial text before animation
function hideInitialText() {
  const textElement = document.querySelector('.animated-text h1');
  if (!textElement) return;
  textElement.style.opacity = '0';
  
  setTimeout(() => {
    textElement.textContent = 'BUNGA MEKAR 🌸';
    textElement.style.opacity = '1';
  }, 300);
}

// Alternating Text Animation
function startTextAnimation() {
  const textElement = document.querySelector('.animated-text h1');
  if (!textElement) return;
  const textArray = ['BUNGA MEKAR 🌸', 'CANTIK BANGET 💕'];
  let currentIndex = 0;

  function alternateText() {
    currentIndex = (currentIndex + 1) % textArray.length;
    textElement.style.opacity = '0';
    
    setTimeout(() => {
      textElement.textContent = textArray[currentIndex];
      textElement.style.opacity = '1';
    }, 300);
  }

  setInterval(alternateText, 4000);
}
