// Ultron — client-side web assistant (no fake scan)
// Works with Web Speech API (SpeechRecognition) & Speech Synthesis

const logEl = document.getElementById('log');
const micBtn = document.getElementById('micBtn');
const stopBtn = document.getElementById('stopBtn');

function log(text, who='system'){
  const div = document.createElement('div');
  div.className = `entry ${who}`;
  div.textContent = `${who === 'user' ? '🎤 You: ' : who === 'ultron' ? '🧠 Ultron: ' : 'ℹ️ '}${text}`;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
}

// --- Text to speech ---
function speak(text){
  log(text, 'ultron');
  if (!('speechSynthesis' in window)) return;
  const ut = new SpeechSynthesisUtterance(text);
  ut.rate = 1; // normal
  const voices = speechSynthesis.getVoices();
  // prefer a voice that sounds clear; fallback to default
  if (voices.length) ut.voice = voices.find(v => /en-US|Google US|Microsoft/gi.test(v.name)) || voices[0];
  speechSynthesis.cancel(); // stop current
  speechSynthesis.speak(ut);
}

// --- Commands handler ---
let listening = false;

async function handleCommand(text){
  text = text.toLowerCase().trim();
  if (!text) { speak("I didn't catch that, Captain."); return; }
  log(text, 'user');

  // basic commands — safe, non-malicious
  if (/^(exit|shutdown|stop|sleep|bye)\b/.test(text)){
    speak("Shutting down. Until next time, Captain.");
    stopListening();
  } else if (/\b(hello|hi|hey)\b/.test(text)){
    speak("Hello, Captain. At your service. Ask me something — for example: 'status', 'time', 'tell a joke', or 'open github'.");
  } else if (/\btime\b/.test(text)){
    const t = new Date();
    speak(`Local time is ${t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
  } else if (/\bdate\b/.test(text)){
    const d = new Date();
    speak(`Today is ${d.toLocaleDateString()}.`);
  } else if (/\b(status|how are you|state)\b/.test(text)){
    speak("Systems nominal. Listening for your commands. No suspicious activity detected.");
  } else if (/\bjoke\b/.test(text)){
    const jokes = [
      "Why did the programmer quit his job? Because he didn't get arrays.",
      "I told my Wi-Fi it was being insecure. It just laughed and gave me a weak password.",
      "Why do Java developers wear glasses? Because they can't C#."
    ];
    speak(jokes[Math.floor(Math.random()*jokes.length)]);
  } else if (/\bopen github\b/.test(text)){
    speak("Opening GitHub in a new tab.");
    window.open('https://github.com', '_blank');
  } else if (/\bhelp\b/.test(text)){
    speak("Try commands like: 'time', 'date', 'tell a joke', 'open GitHub', or 'shutdown'.");
  } else {
    speak("Command not recognized. Say 'help' for examples.");
  }
}

// --- Speech recognition setup ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognizer;

if (SpeechRecognition) {
  recognizer = new SpeechRecognition();
  recognizer.lang = 'en-US';
  recognizer.interimResults = false;
  recognizer.maxAlternatives = 1;
  recognizer.continuous = false;

  recognizer.onresult = (evt) => {
    const transcript = evt.results[0][0].transcript;
    handleCommand(transcript);
  };

  recognizer.onend = () => {
    // if still in listening mode, continue (push-to-talk style handled by startListening)
    if (listening) {
      // small pause to avoid immediate restart loops
      setTimeout(() => recognizer.start(), 300);
    }
  };

  recognizer.onerror = (err) => {
    console.error('Recognition error', err);
    speak("Speech recognition error occurred.");
  };
} else {
  speak("Speech recognition not supported on this browser. Try Chrome or Edge on desktop or Android.");
  log("SpeechRecognition API not found in this browser.", 'system');
}

// --- Control functions ---
function startListening(){
  if (!SpeechRecognition) return;
  listening = true;
  micBtn.textContent = "🎙️ Listening...";
  micBtn.disabled = true;
  stopBtn.disabled = false;
  speak("Awaiting your command, Captain...");
  try {
    recognizer.start();
  } catch(e){
    console.warn("recognizer start error:", e);
  }
}

function stopListening(){
  listening = false;
  micBtn.textContent = "🎙️ Start Listening";
  micBtn.disabled = false;
  stopBtn.disabled = true;
  if (recognizer) try { recognizer.stop(); } catch(e){}
  speak("Stopped listening.");
}

// --- Button events ---
micBtn.addEventListener('click', startListening);
stopBtn.addEventListener('click', stopListening);

// Quick wake: allow pressing 'v' to toggle listening when page focused
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'v') {
    if (listening) stopListening(); else startListening();
  }
});

// Ready
log("Ultron initialized. Press the mic button or press 'v' to toggle listening.", 'system');
