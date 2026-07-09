/**
 * ============================================================================
 * juneeForFinger Pro - LOGIC ENGINE SOFTWARE (PROFESSIONAL EDITION)
 * ============================================================================
 * Deskripsi: Mesin logika utama untuk aplikasi web tes mengetik Indonesia.
 * Fitur: Deteksi ketikan real-time, manajemen spasi otomatis, audio generator
 * mekanikal keyboard, pelacak riwayat lokal, dan sistem medali otomatis.
 * ============================================================================
 */

// 1. DATA KATA UTAMA (DATABASE KOSAKATA)
const wordsDatabase = {
  common: `bila tinggi tahu mata termasuk barang naik jelas tiba akan anak tengah sesuatu orang dengan oleh dari terlalu sedikit harga ini mereka kamu sedang hidup benar keluar lihat rumah kerja sekolah kota jalan waktu makan minum manusia teknologi hari besar baru luar bagian negara jawa dunia kita bisa dapat kami dia kata karena untuk atau serta tetapi sangat setelah sebelum malam siang pagi sore jika ke dari pada`.split(' '),
  advanced: `implementasi transformasi digitalisasi ekosistem komparasi substansial fundamental standardisasi birokrasi profesionalisme akuntabilitas metodologi komitmen rekonstruksi restrukturisasi fluktuasi optimalisasi konseptual efisiensi korelasi kontemporer signifikansi legitimasi konsolidasi regulasi partisipatif komprehensif kapasitas adaptabilitas`.split(' ')
};

// 2. DAFTAR PENCAPAIAN MEDALI (ACHIEVEMENTS)
const achievementsList = [
  { id: 'first_test', icon: '🎯', name: 'Langkah Awal', desc: 'Selesaikan 1 uji coba tes mengetik.' },
  { id: 'wpm_30', icon: '⚡', name: 'Jari Gesit', desc: 'Capai kecepatan ketikan diatas 30 WPM.' },
  { id: 'wpm_60', icon: '🚀', name: 'Kecepatan Cahaya', desc: 'Capai kecepatan fantastis diatas 60 WPM.' },
  { id: 'acc_100', icon: '🔮', name: 'Akurasi Sempurna', desc: 'Selesaikan tes dengan akurasi tepat 100%.' },
  { id: 'custom_master', icon: '✍️', name: 'Pujangga Kustom', desc: 'Mulai tes menggunakan naskah kustom sendiri.' }
];

// 3. VARIABEL STATE GLOBAL APLIKASI
let currentWordsList = [];
let currentWordIndex = 0;
let timerId = null;
let durationSettings = 60;
let secondsLeft = 60;
let isGameStarted = false;

// Variabel Penghitung Metrik Skor
let correctWordsCount = 0;
let wrongWordsCount = 0;
let totalKeystrokes = 0;
let correctCharactersCount = 0;
let activeWordMode = 'common';
let isCustomModeActive = false;
let customTextPool = '';

// 4. ENGINE EFEK SUARA AUDIO SYNTHESIS (Mechanical Keyboard Click)
let audioCtx = null;
function playKeySound() {
  const soundToggle = document.getElementById('setting-sound-toggle');
  if (soundToggle && !soundToggle.checked) return;
  
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    // Membuat gelombang suara klik secara sintetis (tanpa file audio eksternal)
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130 + Math.random() * 60, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
  } catch (error) {
    console.error("Audio Synthesis Engine Error:", error);
  }
}

// 5. REFERENSI ELEMEN DOM UTAMA (SESUAI ID PADA INDEX.HTML)
const quoteDisplay = document.getElementById('quote');
const typingInput = document.getElementById('input');
const liveTimerVal = document.getElementById('time');
const recapPanel = document.getElementById('results');

// 6. INITIALIZATION: MENJALANKAN SISTEM SAAT HALAMAN SELESAI DIMUAT
document.addEventListener('DOMContentLoaded', () => {
  setupSidebarNavigation();
  setupSettingsHandlers();
  setupTestConfigurationControls();
  initApplicationData();
});

function initApplicationData() {
  renderBadges();
  updateGlobalStatsDashboard();
  loadHistoryTable();
  generateWordTokenList();
  
  // Melampirkan event handler ketikan ke kotak input utama
  if (typingInput) {
    typingInput.addEventListener('input', handleLiveTypingInput);
  }
  
  // Pemasangan Event Listener untuk Tombol-Tombol Aksi
  const instantResetBtn = document.getElementById('instant-reset-btn') || document.getElementById('restart');
  if (instantResetBtn) {
    instantResetBtn.addEventListener('click', resetTestSession);
  }
  
  const recapRestartBtn = document.getElementById('recap-restart-btn');
  if (recapRestartBtn) {
    recapRestartBtn.addEventListener('click', resetTestSession);
  }
  
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', clearAllStoredHistory);
  }
  
  const applyCustomBtn = document.getElementById('apply-custom-text-btn');
  if (applyCustomBtn) {
    applyCustomBtn.addEventListener('click', applyCustomTextSetting);
  }
  
  const shareResultBtn = document.getElementById('share-result-btn');
  if (shareResultBtn) {
    shareResultBtn.addEventListener('click', copyResultsToClipboard);
  }

  // Fokus otomatis ke input jika area papan teks di-klik
  if (quoteDisplay) {
    quoteDisplay.addEventListener('click', () => {
      if (typingInput) typingInput.focus();
    });
  }
}

// 7. KONTROL INTERFAZ: NAVIGASI SIDEBAR MENU TABS
function setupSidebarNavigation() {
  const menuItems = document.querySelectorAll('.sidebar-menu .menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      // Nonaktifkan semua menu item aktif sebelumnya
      menuItems.forEach(btn => btn.classList.remove('active'));
      
      // Aktifkan menu item yang baru diklik
      e.currentTarget.classList.add('active');
      
      // Sembunyikan semua konten tab halaman
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
      
      // Tampilkan kontainer tab target
      const targetTabId = e.currentTarget.getAttribute('data-tab');
      const targetElement = document.getElementById(targetTabId);
      if (targetElement) {
        targetElement.classList.add('active');
      }
    });
  });
}

// 8. MANAJEMEN SISTEM PENGATURAN TEMA DAN UKURAN TEKS
function setupSettingsHandlers() {
  const themeSelect = document.getElementById('setting-theme-select');
  if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
      document.documentElement.setAttribute('data-theme', e.target.value);
    });
  }

  const fontSelect = document.getElementById('setting-fontsize-select');
  if (fontSelect) {
    fontSelect.addEventListener('change', (e) => {
      if (quoteDisplay) {
        quoteDisplay.style.fontSize = e.target.value;
      }
    });
  }
}

// 9. PENGATUR KONFIGURASI PRESET WAKTU DAN MODE KATA LATIHAN
function setupTestConfigurationControls() {
  // Pengatur Tombol Preset Durasi Detik
  const timeBtns = document.querySelectorAll('.time-btn');
  timeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (isGameStarted) return; // Kunci durasi saat tes berjalan
      
      timeBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      durationSettings = parseInt(e.target.getAttribute('data-time'));
      isCustomModeActive = false;
      resetTestSession();
    });
  });

  // Pengatur Tombol Tingkat Kesulitan Kosakata
  const modeBtns = document.querySelectorAll('.word-mode-btn');
  modeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (isGameStarted) return; // Kunci mode saat tes berjalan
      
      modeBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      activeWordMode = e.target.getAttribute('data-mode');
      isCustomModeActive = false;
      resetTestSession();
    });
  });
}

// 10. GENERATOR ARRAY TOKEN KATA DI PAPAN DISPLAY
function generateWordTokenList() {
  if (!quoteDisplay) return;
  
  let sourceArray = wordsDatabase[activeWordMode];
  
  // Deteksi jika user sedang dalam mode pengetikan teks kustom bikinan sendiri
  if (isCustomModeActive && customTextPool.trim().length > 0) {
    sourceArray = customTextPool.split(/\s+/);
  }

  const generatedTokens = [];
  const targetCount = isCustomModeActive ? sourceArray.length : 100;
  
  for (let i = 0; i < targetCount; i++) {
    const randomPick = sourceArray[isCustomModeActive ? i : Math.floor(Math.random() * sourceArray.length)];
    if (randomPick) {
      generatedTokens.push(randomPick);
    }
  }

  currentWordsList = generatedTokens;
  currentWordIndex = 0;
  
  // Render kata ke dalam format HTML span ber-indeks khusus
  quoteDisplay.innerHTML = currentWordsList.map((word, idx) => {
    return `<span class="w-token-${idx} ${idx === 0 ? 'active' : ''}">${word}</span>`;
  }).join(' ');
  
  quoteDisplay.scrollTop = 0;
}

// 11. INTI PERBAIKAN: ENGINE DETEKSI DAN MANAJEMEN PENGETIKAN SPASI KATA
function handleLiveTypingInput(e) {
  const inputData = e.target.value;

  // Nyalakan countdown timer jika ketikan pertama dimulai
  if (!isGameStarted) {
    startCountdownTimer();
  }

  totalKeystrokes++;
  playKeySound();

  const currentTargetWord = currentWordsList[currentWordIndex];
  const targetSpan = quoteDisplay.querySelector(`.w-token-${currentWordIndex}`);

  if (!targetSpan) return;

  // JIKA USER MENEKAN SPASI DI AKHIR KATA (AKSI LOCK KATA BERJALAN)
  if (inputData.endsWith(' ')) {
    const finalizedTypedWord = inputData.trim();
    
    // Cegah error akibat pengetikan spasi ganda kosong berulang-ulang
    if (finalizedTypedWord.length === 0) {
      e.target.value = '';
      return;
    }

    // Hilangkan efek penanda aktif dari kata lama
    targetSpan.classList.remove('active');

    // Proses validasi kecocokan karakter kata
    if (finalizedTypedWord === currentTargetWord) {
      targetSpan.className = 'correct';
      correctWordsCount++;
      correctCharactersCount += finalizedTypedWord.length + 1; // Ditambah 1 untuk spasi karakter
    } else {
      targetSpan.className = 'wrong';
      wrongWordsCount++;
    }

    // Melangkah maju ke urutan indeks kata berikutnya
    currentWordIndex++;
    
    if (currentWordIndex < currentWordsList.length) {
      const nextSpan = quoteDisplay.querySelector(`.w-token-${currentWordIndex}`);
      if (nextSpan) {
        nextSpan.classList.add('active');
        
        // Fitur Auto Scroll Papan Teks kebawah jika baris ketikan mulai meluncur turun
        if (nextSpan.offsetTop > quoteDisplay.clientHeight + quoteDisplay.scrollTop - 45) {
          quoteDisplay.scrollTop += 38;
        }
      }
    } else {
      // Jika list kata habis dalam mode normal, generate bank data baru
      generateWordTokenList();
    }

    // PERBAIKAN UTAMA: Bersihkan kotak input secara total tanpa ada sisa tumpukan teks!
    e.target.value = '';
  } else {
    // REAL-TIME HIGHLIGHT: Berikan warna umpan balik visual saat sedang mengetik (Biru / Merah)
    const currentTypedChunk = inputData.trim();
    if (currentTargetWord.startsWith(currentTypedChunk)) {
      targetSpan.className = `w-token-${currentWordIndex} active`;
    } else {
      targetSpan.className = `w-token-${currentWordIndex} active wrong`;
    }
  }
}

// 12. COUNTDOWN TIMER ENGINE
function startCountdownTimer() {
  isGameStarted = true;
  secondsLeft = durationSettings;
  
  if (liveTimerVal) liveTimerVal.textContent = formatTimeLayout(secondsLeft);
  
  // Nonaktifkan kontrol setelan selama tes berlangsung
  document.querySelectorAll('.time-btn, .word-mode-btn').forEach(btn => btn.disabled = true);
  if (recapPanel) recapPanel.hidden = true;

  timerId = setInterval(() => {
    secondsLeft--;
    if (liveTimerVal) liveTimerVal.textContent = formatTimeLayout(secondsLeft);
    
    if (secondsLeft <= 0) {
      clearInterval(timerId);
      triggerSessionFinished();
    }
  }, 1000);
}

function formatTimeLayout(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// 13. PENYUSUN DAN ANALISIS DATA HASIL SKOR AKHIR (REKAPAN)
function triggerSessionFinished() {
  if (typingInput) typingInput.disabled = true;
  
  const minutesFactor = durationSettings / 60;
  const netWpm = Math.max(0, Math.round((correctCharactersCount / 5) / minutesFactor));
  const totalAttemptedWords = correctWordsCount + wrongWordsCount;
  const accuracyPercentage = totalAttemptedWords > 0 ? Math.round((correctWordsCount / totalAttemptedWords) * 100) : 0;
  const cpmCalculated = Math.round(correctCharactersCount / minutesFactor);

  // Pencarian ID Penampung Data Rekapan (Mendukung ID Pendek & ID Panjang)
  const wpmEl = document.getElementById('recap-wpm') || document.getElementById('wpm');
  const accEl = document.getElementById('recap-accuracy');
  const cpmEl = document.getElementById('recap-cpm');
  const correctEl = document.getElementById('recap-correct-words') || document.getElementById('correct');
  const wrongEl = document.getElementById('recap-wrong-words') || document.getElementById('wrong');
  const rawEl = document.getElementById('recap-raw-keys');

  // Input Data ke Elemen Statistik Rekap
  if (wpmEl) wpmEl.textContent = netWpm;
  if (accEl) accEl.textContent = `${accuracyPercentage}%`;
  if (cpmEl) cpmEl.textContent = cpmCalculated;
  if (correctEl) correctEl.textContent = correctWordsCount;
  if (wrongEl) wrongEl.textContent = wrongWordsCount;
  if (rawEl) rawEl.textContent = totalKeystrokes;

  // Analisis Performa & Klasifikasi Saran
  let ratingText = '';
  let adviceText = '';
  
  if (netWpm < 25) {
    ratingText = '🌱 Pemula (Novice)';
    adviceText = 'Fokuslah pada penempatan posisi 10 jari yang benar terlebih dahulu tanpa sering melihat ke arah keyboard.';
  } else if (netWpm < 55) {
    ratingText = '⚡ Produktif (Intermediate)';
    adviceText = 'Kecepatan Anda sudah sangat bagus untuk aktivitas mengetik harian. Berlatihlah mengurangi typo untuk mempercepat WPM.';
  } else {
    ratingText = '🔮 Pakar Mengetik (Typing Master)';
    adviceText = 'Luar biasa! Kecepatan mengetik Anda berada di atas rata-rata populasi dunia, setara juru ketik profesional!';
  }

  const ratingEl = document.getElementById('recap-rating');
  const adviceEl = document.getElementById('recap-advice-text');
  if (ratingEl) ratingEl.textContent = ratingText;
  if (adviceEl) adviceEl.textContent = adviceText;

  // Tampilkan panel rekapan skor akhir dengan animasi gulir halus
  if (recapPanel) {
    recapPanel.hidden = false;
    recapPanel.scrollIntoView({ behavior: 'smooth' });
  }

  // Simpan data log dan verifikasi sistem pencapaian medali
  saveTestToLocalStorage(netWpm, accuracyPercentage, durationSettings);
  checkAndUnlockBadges(netWpm, accuracyPercentage);
}

// 14. RESET TEST SESSION ENGINE
function resetTestSession() {
  clearInterval(timerId);
  isGameStarted = false;
  correctWordsCount = 0;
  wrongWordsCount = 0;
  totalKeystrokes = 0;
  correctCharactersCount = 0;
  secondsLeft = durationSettings;
  
  if (liveTimerVal) liveTimerVal.textContent = formatTimeLayout(secondsLeft);
  
  if (typingInput) {
    typingInput.disabled = false;
    typingInput.value = '';
  }
  
  if (recapPanel) recapPanel.hidden = true;
  
  // Aktifkan kembali kontrol setelan durasi & mode
  document.querySelectorAll('.time-btn, .word-mode-btn').forEach(btn => btn.disabled = false);
  
  generateWordTokenList();
  
  // Set fokus otomatis kembali ke kolom input setelah delay mikro 
  setTimeout(() => {
    if (typingInput) typingInput.focus();
  }, 50);
}

// 15. MANAJEMEN SISTEM MODAL TEKS KUSTOM
function applyCustomTextSetting() {
  const customInput = document.getElementById('custom-text-input');
  if (!customInput) return;
  
  const content = customInput.value;
  if (content.trim().split(/\s+/).length < 5) {
    alert('⚠️ Naskah teks kustom minimal harus berisi minimal 5 kata!');
    return;
  }
  
  customTextPool = content;
  isCustomModeActive = true;
  
  // Otomatis pindahkan tab pengguna ke tab tes mengetik
  const testTabButton = document.querySelector('.sidebar-menu .menu-item[data-tab="tab-test"]');
  if (testTabButton) {
    testTabButton.click();
  }
  
  resetTestSession();
  
  // Buka medali master kustom teks
  let unlocked = JSON.parse(localStorage.getItem('jff_badges') || '[]');
  if (!unlocked.includes('custom_master')) {
    unlocked.push('custom_master');
    localStorage.setItem('jff_badges', JSON.stringify(unlocked));
    renderBadges();
  }
}

// 16. LOCAL STORAGE CONTROLLER: RIWAYAT DATA PENGETIKAN
function saveTestToLocalStorage(wpm, acc, dur) {
  try {
    const history = JSON.parse(localStorage.getItem('jff_history') || '[]');
    const dateStamp = new Date().toLocaleDateString('id-ID') + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    const newLog = {
      date: dateStamp,
      duration: `${dur}s`,
      wpm: wpm,
      acc: `${acc}%`,
      ratio: `${correctWordsCount}/${wrongWordsCount}`
    };
    
    history.unshift(newLog); // Menambahkan catatan terbaru ke baris paling atas
    localStorage.setItem('jff_history', JSON.stringify(history));
    
    updateGlobalStatsDashboard();
    loadHistoryTable();
  } catch (error) {
    console.error("Gagal menyimpan riwayat ke local storage:", error);
  }
}

function updateGlobalStatsDashboard() {
  const history = JSON.parse(localStorage.getItem('jff_history') || '[]');
  const totalTestsEl = document.getElementById('global-total-tests');
  if (totalTestsEl) totalTestsEl.textContent = history.length;
  
  if (history.length === 0) return;

  let totalWpm = 0;
  let maxWpm = 0;
  
  history.forEach(item => {
    totalWpm += item.wpm;
    if (item.wpm > maxWpm) {
      maxWpm = item.wpm;
    }
  });

  const avgWpmEl = document.getElementById('global-avg-wpm');
  const maxWpmEl = document.getElementById('global-max-wpm');
  
  if (avgWpmEl) avgWpmEl.textContent = Math.round(totalWpm / history.length);
  if (maxWpmEl) maxWpmEl.textContent = maxWpm;
}

function loadHistoryTable() {
  const history = JSON.parse(localStorage.getItem('jff_history') || '[]');
  const tbody = document.getElementById('history-table-body');
  if (!tbody) return;
  
  if (history.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 35px;">Belum ada log data riwayat latihan.</td></tr>`;
    return;
  }

  tbody.innerHTML = history.map(item => {
    return `<tr>
      <td>${item.date}</td>
      <td><span class="live-badge" style="background:rgba(255,255,255,0.05); color:var(--text-main); font-family:var(--font-mono); padding: 2px 6px; border-radius:4px;">${item.duration}</span></td>
      <td style="font-weight:700; color:var(--accent); font-family:var(--font-mono);">${item.wpm}</td>
      <td style="font-family:var(--font-mono);">${item.acc}</td>
      <td style="font-size:12px; color:var(--text-muted); font-family:var(--font-mono);">${item.ratio}</td>
    </tr>`;
  }).join('');
}

function clearAllStoredHistory() {
  if (confirm('Hapus seluruh log data riwayat latihan dan medali pencapaian secara permanen?')) {
    localStorage.removeItem('jff_history');
    localStorage.removeItem('jff_badges');
    updateGlobalStatsDashboard();
    loadHistoryTable();
    renderBadges();
  }
}

// 17. RECOGNITION ENGINE: LOGIKA PEMBERIAN MEDAL KEMAMPUAN
function renderBadges() {
  const container = document.getElementById('badges-container');
  if (!container) return;
  
  const unlocked = JSON.parse(localStorage.getItem('jff_badges') || '[]');
  
  container.innerHTML = achievementsList.map(item => {
    const isUnlocked = unlocked.includes(item.id);
    return `<div class="badge-item ${isUnlocked ? 'unlocked' : ''}">
      <div class="badge-icon">${item.icon}</div>
      <div class="badge-name">${item.name}</div>
      <div class="badge-desc">${item.desc}</div>
      <span style="font-size:10px; font-weight:bold; color: ${isUnlocked ? 'var(--correct)' : 'var(--text-muted)'}; margin-top:6px; display:inline-block;">
        ${isUnlocked ? '🔓 TERBUKA' : '🔒 TERKUNCI'}
      </span>
    </div>`;
  }).join('');
}

function checkAndUnlockBadges(wpm, acc) {
  let unlocked = JSON.parse(localStorage.getItem('jff_badges') || '[]');
  
  if (!unlocked.includes('first_test')) unlocked.push('first_test');
  if (wpm >= 30 && !unlocked.includes('wpm_30')) unlocked.push('wpm_30');
  if (wpm >= 60 && !unlocked.includes('wpm_60')) unlocked.push('wpm_60');
  if (acc === 100 && !unlocked.includes('acc_100')) unlocked.push('acc_100');
  
  localStorage.setItem('jff_badges', JSON.stringify(unlocked));
  renderBadges();
}

// 18. SHARE UTILITY: CLIPBOARD COPIER
function copyResultsToClipboard() {
  const wpmEl = document.getElementById('recap-wpm') || document.getElementById('wpm');
  const accEl = document.getElementById('recap-accuracy') || { textContent: '0%' };
  const ratingEl = document.getElementById('recap-rating') || { textContent: 'Normal' };
  
  const textToCopy = `🚀 Hasil Tes Mengetik juneeForFinger Pro:\n📈 Kecepatan: ${wpmEl.textContent} WPM\n🎯 Akurasi: ${accEl.textContent}\n🏆 Kategori: ${ratingEl.textContent}\n\nLatih jemarimu sekarang di juneeForFinger!`;
  
  navigator.clipboard.writeText(textToCopy).then(() => {
    alert('📋 Rangkuman skor berhasil disalin ke clipboard komputer Anda!');
  }).catch(err => {
    console.error('Gagal menyalin teks:', err);
  });
}