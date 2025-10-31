const words = `bila tinggi tahu mata termasuk barang naik jelas tiba akan anak tengah sesuatu orang dengan oleh dari terlalu sedikit harga ini mereka kamu sedang hidup benar keluar lihat rumah kerja sekolah kota jalan waktu makan minum`.split(' ');

const quoteEl = document.getElementById('quote');
const inputEl = document.getElementById('input');
const timeEl = document.getElementById('time');
const resultsEl = document.getElementById('results');
const correctEl = document.getElementById('correct');
const wrongEl = document.getElementById('wrong');
const wpmEl = document.getElementById('wpm');
const restartBtn = document.getElementById('restart');

let currentWords = [], index = 0, timer = null, timeLeft = 60, started = false, correct = 0, wrong = 0;

function makeQuote(n=30) {
  const out = [];
  for (let i=0; i<n; i++) out.push(words[Math.floor(Math.random()*words.length)]);
  currentWords = out; index = 0;
  quoteEl.innerHTML = currentWords.map((w,i)=>`<span class="w${i===0?' active':''}">${w}</span>`).join(' ');
}

function startTimer() {
  if (started) return;
  started = true; timeLeft = 60; timeEl.textContent = formatTime(timeLeft);
  timer = setInterval(()=>{
    timeLeft--;
    timeEl.textContent = formatTime(timeLeft);
    if (timeLeft <= 0) { clearInterval(timer); finish(); }
  },1000);
}

function formatTime(sec) {
  const m = Math.floor(sec/60), s = sec%60;
  return `${m}:${s.toString().padStart(2,'0')}`;
}

function finish() {
  inputEl.disabled = true;
  resultsEl.hidden = false;
  correctEl.textContent = correct;
  wrongEl.textContent = wrong;
  const wpm = Math.round(correct);
  wpmEl.textContent = wpm;
}

inputEl.addEventListener('input', e=>{
  const val = e.target.value.trim();
  if (!started) startTimer();
  if (e.target.value.endsWith(' ')) {
    const typed = val, target = currentWords[index];
    const spans = quoteEl.querySelectorAll('span');
    spans[index].classList.remove('active');
    if (typed === target) {
      spans[index].classList.add('correct'); correct++;
    } else {
      spans[index].classList.add('wrong'); wrong++;
    }
    index++;
    if (index < spans.length) spans[index].classList.add('active');
    e.target.value = '';
  }
});

restartBtn.addEventListener('click', reset);

function reset() {
  clearInterval(timer);
  started = false; correct = 0; wrong = 0; timeLeft = 60;
  timeEl.textContent = formatTime(timeLeft);
  inputEl.disabled = false; inputEl.value = '';
  resultsEl.hidden = true;
  makeQuote(40);
  inputEl.focus();
}

makeQuote(40);
quoteEl.addEventListener('click', ()=>inputEl.focus());
