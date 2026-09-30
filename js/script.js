/* =========================================================
   Listening Room — player, mood switching, library views
   Track data: js/playlists.js    Mood copy: js/moods.js
   ========================================================= */

const albumCoverButton = document.getElementById('coverArtSmall');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const progressTrack = document.getElementById('progressTrack');
const progressFill = document.getElementById('progressFill');
const timeElapsedEl = document.getElementById('timeElapsed');
const timeTotalEl = document.getElementById('timeTotal');
const trackTitleEl = document.getElementById('trackTitle');
const trackArtistEl = document.getElementById('trackArtist');
const nowPlayingLabel = document.getElementById('nowPlayingLabel');
const coverArtSmallImg = document.querySelector('#coverArtSmall img');
const lyricsMenuBtn = document.getElementById('lyricsMenuBtn');
const queueBtn = document.getElementById('queueBtn');
const expandBtn = document.getElementById('expandBtn');
const lyricsContent = document.getElementById('lyricsContent');
const lyricsTrackInfo = document.getElementById('lyricsTrackInfo');
const favBtn = document.getElementById('favBtn');
const volumeSlider = document.getElementById('volumeSlider');
const heroPlayBtn = document.getElementById('heroPlayBtn');
const heroShuffleBtn = document.getElementById('heroShuffleBtn');
const librarySearch = document.getElementById('librarySearch');

const nowPanel = document.getElementById('nowPanel');
const nowCurrent = document.getElementById('nowCurrent');
const nowQueueList = document.getElementById('nowQueueList');

const audio = new Audio();
audio.volume = 0.9;

const FAV_KEY = 'atmo-favourites';
const RECENT_KEY = 'atmo-recent';

let activeMood = DEFAULT_MOOD;
let currentView = 'home';
let queueMood = DEFAULT_MOOD;
let currentTrack = tracksFor(DEFAULT_MOOD);
let currentIndex = 0;
let isPlaying = false;
let currentLyrics = [];
let activeLyricIndex = -1;
let shuffleOn = false;
let repeatOn = false;
let activeNowTab = 'queue';

/* ---------- Helpers ---------- */

function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function trackKey(track) {
  return track.src || `${track.title}::${track.artist}`;
}

function coverOf(track) {
  return track.cover || 'assets/covers/placeholder-cover.svg';
}

/* ---------- Favourites ---------- */

function loadFavourites() {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveFavourites(list) {
  localStorage.setItem(FAV_KEY, JSON.stringify(list));
}

function isFavourite(track) {
  const key = trackKey(track);
  return loadFavourites().some((t) => trackKey(t) === key);
}

function toggleFavourite(track) {
  if (!track) return;
  const list = loadFavourites();
  const key = trackKey(track);
  const next = list.some((t) => trackKey(t) === key)
    ? list.filter((t) => trackKey(t) !== key)
    : [{ title: track.title, artist: track.artist, src: track.src, cover: track.cover, album: track.album }, ...list];
  saveFavourites(next);
  updateFavButton();
  if (currentView === 'favourites') renderFavourites();
}

/* ---------- Recent ---------- */

function loadRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

function pushRecent(track) {
  if (!track || !track.src) return;
  const key = trackKey(track);
  const next = [
    { title: track.title, artist: track.artist, src: track.src, cover: track.cover, album: track.album, mood: queueMood },
    ...loadRecent().filter((t) => trackKey(t) !== key)
  ].slice(0, 24);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

function allLibraryTracks() {
  return MOOD_ORDER.flatMap((id) =>
    tracksFor(id).map((track, index) => ({ ...track, mood: id, index }))
  );
}

function findTrackLocation(track) {
  for (const id of MOOD_ORDER) {
    const list = tracksFor(id);
    const index = list.findIndex((t) => trackKey(t) === trackKey(track));
    if (index >= 0) return { mood: id, index, list };
  }
  return { mood: queueMood, index: 0, list: [track] };
}

/* ---------- Player core ---------- */

function setPlayIcons(playing) {
  playBtn.classList.toggle('is-playing', playing);
}

function loadTrack(index, autoplay = false) {
  if (!currentTrack.length) return;
  currentIndex = ((index % currentTrack.length) + currentTrack.length) % currentTrack.length;
  const track = currentTrack[currentIndex];

  trackTitleEl.textContent = track.title;
  trackArtistEl.textContent = track.artist;
  coverArtSmallImg.src = coverOf(track);
  nowPlayingLabel.textContent = `${moodMeta[queueMood].label} — ${currentIndex + 1} of ${currentTrack.length}`;

  progressFill.style.width = '0%';
  timeElapsedEl.textContent = '0:00';
  timeTotalEl.textContent = '0:00';

  if (track.src) audio.src = track.src;

  loadLyrics(track);
  updateFavButton();
  pushRecent(track);
  renderNowPlaying();
  highlightPlayingCards();

  // Sync fullscreen player if open
  if (typeof syncFsPlayer === 'function') syncFsPlayer();
}

function playAudio() {
  audio.play();
  isPlaying = true;
  playBtn.setAttribute('aria-label', 'Pause');
  setPlayIcons(true);
  if (typeof syncFsPlayIcons === 'function') syncFsPlayIcons();
  highlightPlayingCards();
}

function pauseAudio() {
  audio.pause();
  isPlaying = false;
  playBtn.setAttribute('aria-label', 'Play');
  setPlayIcons(false);
  if (typeof syncFsPlayIcons === 'function') syncFsPlayIcons();
  highlightPlayingCards();
}

function goToTrack(index, autoplay) {
  if (!currentTrack.length) return;
  loadTrack(index, autoplay);
  if (autoplay) playAudio();
}

function playFromMood(moodId, index, autoplay = true) {
  const list = tracksFor(moodId);
  if (!list.length) return;
  queueMood = moodId;
  currentTrack = list;
  goToTrack(index, autoplay);
}

function playMood(moodId, shuffle = false) {
  const list = tracksFor(moodId);
  if (!list.length) return;
  const start = shuffle ? Math.floor(Math.random() * list.length) : 0;
  shuffleOn = shuffle;
  updateShuffleBtn();
  playFromMood(moodId, start, true);
}

function updateShuffleBtn() {
  shuffleBtn.classList.toggle('is-on', shuffleOn);
}

function updateRepeatBtn() {
  repeatBtn.classList.toggle('is-on', repeatOn);
}

playBtn.addEventListener('click', () => {
  if (!currentTrack.length) {
    playMood(activeMood);
    return;
  }
  if (!currentTrack[currentIndex]) loadTrack(0);
  isPlaying ? pauseAudio() : playAudio();
});

prevBtn.addEventListener('click', () => goToTrack(currentIndex - 1, isPlaying));
nextBtn.addEventListener('click', () => goToTrack(currentIndex + 1, isPlaying));

shuffleBtn.addEventListener('click', () => {
  shuffleOn = !shuffleOn;
  updateShuffleBtn();
});

repeatBtn.addEventListener('click', () => {
  repeatOn = !repeatOn;
  updateRepeatBtn();
});

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = `${(audio.currentTime / audio.duration) * 100}%`;
  progressFill.style.width = pct;
  timeElapsedEl.textContent = formatTime(audio.currentTime);
  updateLyricsSync(audio.currentTime);

  // Sync fullscreen player progress + lyrics
  if (typeof fsProgressFill !== 'undefined') {
    fsProgressFill.style.width = pct;
    fsTimeElapsed.textContent = formatTime(audio.currentTime);
    updateFsLyricsSync(audio.currentTime);
  }
});

audio.addEventListener('loadedmetadata', () => {
  timeTotalEl.textContent = formatTime(audio.duration);
  if (typeof fsTimeTotal !== 'undefined') {
    fsTimeTotal.textContent = formatTime(audio.duration);
  }
});

audio.addEventListener('ended', () => {
  if (repeatOn) {
    audio.currentTime = 0;
    playAudio();
    return;
  }
  if (shuffleOn && currentTrack.length > 1) {
    let next = Math.floor(Math.random() * currentTrack.length);
    if (next === currentIndex) next = (next + 1) % currentTrack.length;
    goToTrack(next, true);
    return;
  }
  goToTrack(currentIndex + 1, true);
});

progressTrack.addEventListener('click', (e) => {
  const rect = progressTrack.getBoundingClientRect();
  const ratio = (e.clientX - rect.left) / rect.width;
  if (!audio.duration) return;
  audio.currentTime = ratio * audio.duration;
});

volumeSlider.addEventListener('input', () => {
  audio.volume = Number(volumeSlider.value);
});

favBtn.addEventListener('click', () => {
  if (currentTrack[currentIndex]) toggleFavourite(currentTrack[currentIndex]);
});

function updateFavButton() {
  const track = currentTrack[currentIndex];
  const on = track && isFavourite(track);
  favBtn.classList.toggle('is-on', Boolean(on));
  favBtn.textContent = on ? '♥' : '♡';
  favBtn.setAttribute('aria-label', on ? 'Remove favourite' : 'Favourite');
}

/* ---------- Now-playing panel tabs ---------- */

function setNowTab(tab) {
  activeNowTab = tab;
  document.querySelectorAll('.now-tab').forEach((el) => {
    el.classList.toggle('is-active', el.dataset.nowTab === tab);
  });
  document.querySelectorAll('.now-section').forEach((el) => {
    el.hidden = el.dataset.nowPane !== tab;
  });
}

document.querySelectorAll('.now-tab').forEach((el) => {
  el.addEventListener('click', () => setNowTab(el.dataset.nowTab));
});

function openNowPanel() {
  nowPanel.classList.add('open');
}

lyricsMenuBtn.addEventListener('click', () => {
  setNowTab('lyrics');
  openNowPanel();
});

queueBtn.addEventListener('click', () => {
  setNowTab('queue');
  openNowPanel();
});

/* ---------- Lyrics ---------- */

function parseLRC(text) {
  const lines = [];
  const timePattern = /^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)/;
  const metaPattern = /^\[[a-zA-Z]+:/;

  text.split('\n').forEach((raw) => {
    const line = raw.trim();
    if (!line) return;
    if (metaPattern.test(line)) return;
    const match = line.match(timePattern);
    if (!match) return;
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    const ms = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
    const time = minutes * 60 + seconds + ms / 1000;
    const lyric = match[4].trim();
    if (lyric && /^[^\x00-\x7F\s]+\s*:/.test(lyric)) return;
    lines.push({ time, text: lyric });
  });

  return lines.sort((a, b) => a.time - b.time);
}

async function fetchLyricsFromFile(src) {
  try {
    const response = await fetch(src);
    if (!response.ok) return [];
    let text = await response.text();
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    return parseLRC(text);
  } catch {
    return [];
  }
}

async function loadLyrics(track) {
  currentLyrics = [];
  activeLyricIndex = -1;

  if (track.lyricsText) {
    currentLyrics = parseLRC(track.lyricsText);
  } else if (track.lyricsSrc) {
    currentLyrics = await fetchLyricsFromFile(track.lyricsSrc);
  } else if (track.lyrics) {
    currentLyrics = track.lyrics;
  }

  renderLyrics(track);
  if (typeof renderFsLyrics === 'function') renderFsLyrics();
}

function renderLyrics(track) {
  lyricsTrackInfo.innerHTML = `
    <div class="lyrics-track-title"></div>
    <div class="lyrics-track-artist"></div>
  `;
  lyricsTrackInfo.querySelector('.lyrics-track-title').textContent = track.title;
  lyricsTrackInfo.querySelector('.lyrics-track-artist').textContent = track.artist;

  if (!currentLyrics.length) {
    lyricsContent.innerHTML = '<p class="lyrics-empty">No lyrics available for this track.</p>';
    return;
  }

  lyricsContent.innerHTML = '';
  currentLyrics.forEach((line, index) => {
    if (!line.text) {
      const spacer = document.createElement('div');
      spacer.className = 'lyrics-line-spacer';
      lyricsContent.appendChild(spacer);
      return;
    }
    const el = document.createElement('div');
    el.className = 'lyrics-line';
    el.dataset.index = index;
    el.textContent = line.text;
    el.addEventListener('click', () => {
      if (!audio.duration) return;
      audio.currentTime = line.time;
      if (!isPlaying) playAudio();
    });
    lyricsContent.appendChild(el);
  });
}

function updateLyricsSync(currentTime) {
  if (!currentLyrics.length) return;
  let newIndex = -1;
  for (let i = currentLyrics.length - 1; i >= 0; i--) {
    if (currentLyrics[i].text && currentTime >= currentLyrics[i].time) {
      newIndex = i;
      break;
    }
  }
  if (newIndex === activeLyricIndex) return;
  activeLyricIndex = newIndex;
  lyricsContent.querySelectorAll('.lyrics-line').forEach((el) => {
    const idx = parseInt(el.dataset.index, 10);
    el.classList.toggle('active', idx === newIndex);
  });
  const activeLine = lyricsContent.querySelector(`[data-index="${newIndex}"]`);
  if (activeLine && activeNowTab === 'lyrics') activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ---------- Fullscreen player ---------- */

const fsPlayer = document.getElementById('fsPlayer');
const fsBg = document.getElementById('fsBg');
const fsCoverImg = document.getElementById('fsCoverImg');
const fsTitle = document.getElementById('fsTitle');
const fsArtist = document.getElementById('fsArtist');
const fsFavBtn = document.getElementById('fsFavBtn');
const fsPlayBtn = document.getElementById('fsPlayBtn');
const fsPrevBtn = document.getElementById('fsPrevBtn');
const fsNextBtn = document.getElementById('fsNextBtn');
const fsShuffleBtn = document.getElementById('fsShuffleBtn');
const fsRepeatBtn = document.getElementById('fsRepeatBtn');
const fsProgressTrack = document.getElementById('fsProgressTrack');
const fsProgressFill = document.getElementById('fsProgressFill');
const fsTimeElapsed = document.getElementById('fsTimeElapsed');
const fsTimeTotal = document.getElementById('fsTimeTotal');
const fsVolumeSlider = document.getElementById('fsVolumeSlider');
const fsCloseBtn = document.getElementById('fsCloseBtn');
const fsExpandToggle = document.getElementById('fsExpandToggle');
const fsLyricsToggle = document.getElementById('fsLyricsToggle');
const fsQueueToggle = document.getElementById('fsQueueToggle');
const fsBody = document.getElementById('fsBody');
const fsRight = document.getElementById('fsRight');
const fsLyricsScroll = document.getElementById('fsLyricsScroll');
const fsVolMax = document.getElementById('fsVolMax');

let fsLyricsShown = false;
let fsActiveLyricIndex = -1;

function openFsPlayer() {
  syncFsPlayer();
  fsPlayer.classList.add('open');
  fsPlayer.setAttribute('aria-hidden', 'false');
}

function closeFsPlayer() {
  fsPlayer.classList.remove('open');
  fsPlayer.setAttribute('aria-hidden', 'true');
}

function syncFsPlayer() {
  const track = currentTrack[currentIndex];
  if (!track) return;

  const cover = coverOf(track);
  fsBg.style.backgroundImage = `url("${cover}")`;
  fsCoverImg.src = cover;
  fsTitle.textContent = track.title;
  fsArtist.textContent = track.artist;

  // Sync fav button
  const on = isFavourite(track);
  fsFavBtn.textContent = on ? '♥' : '♡';
  fsFavBtn.classList.toggle('is-on', on);

  // Sync transport states
  fsShuffleBtn.classList.toggle('is-on', shuffleOn);
  fsRepeatBtn.classList.toggle('is-on', repeatOn);
  syncFsPlayIcons();

  // Sync volume
  fsVolumeSlider.value = audio.volume;

  // Sync progress
  if (audio.duration) {
    fsProgressFill.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    fsTimeElapsed.textContent = formatTime(audio.currentTime);
    fsTimeTotal.textContent = formatTime(audio.duration);
  } else {
    fsProgressFill.style.width = '0%';
    fsTimeElapsed.textContent = '0:00';
    fsTimeTotal.textContent = '0:00';
  }

  // Render lyrics in fs panel
  renderFsLyrics();
}

function syncFsPlayIcons() {
  fsPlayBtn.classList.toggle('is-playing', isPlaying);
}

function renderFsLyrics() {
  fsLyricsScroll.innerHTML = '';
  fsActiveLyricIndex = -1;

  if (!currentLyrics.length) {
    fsLyricsScroll.innerHTML = '<p class="fs-lyrics-empty">No Lyrics Available right now</p>';
    return;
  }

  currentLyrics.forEach((line, index) => {
    if (!line.text) {
      const spacer = document.createElement('div');
      spacer.className = 'fs-lyrics-spacer';
      fsLyricsScroll.appendChild(spacer);
      return;
    }
    const el = document.createElement('div');
    el.className = 'fs-lyrics-line';
    el.dataset.index = index;
    el.textContent = line.text;
    el.addEventListener('click', () => {
      if (!audio.duration) return;
      audio.currentTime = line.time;
      if (!isPlaying) playAudio();
    });
    fsLyricsScroll.appendChild(el);
  });
}

function updateFsLyricsSync(currentTime) {
  if (!currentLyrics.length) return;
  let newIndex = -1;
  for (let i = currentLyrics.length - 1; i >= 0; i--) {
    if (currentLyrics[i].text && currentTime >= currentLyrics[i].time) {
      newIndex = i;
      break;
    }
  }
  if (newIndex === fsActiveLyricIndex) return;
  fsActiveLyricIndex = newIndex;
  fsLyricsScroll.querySelectorAll('.fs-lyrics-line').forEach((el) => {
    const idx = parseInt(el.dataset.index, 10);
    el.classList.toggle('active', idx === newIndex);
  });
  const activeLine = fsLyricsScroll.querySelector(`[data-index="${newIndex}"]`);
  if (activeLine && fsLyricsShown) activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function toggleFsLyrics() {
  fsLyricsShown = !fsLyricsShown;
  fsLyricsToggle.classList.toggle('active', fsLyricsShown);

  if (fsLyricsShown) {
    fsRight.hidden = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fsRight.classList.add('show');
      });
    });
  } else {
    fsRight.classList.remove('show');
    setTimeout(() => { fsRight.hidden = true; }, 350);
  }
}

// FS event listeners
fsCloseBtn.addEventListener('click', closeFsPlayer);
fsExpandToggle.addEventListener('click', closeFsPlayer);

fsPlayBtn.addEventListener('click', () => {
  if (!currentTrack.length) { playMood(activeMood); return; }
  if (!currentTrack[currentIndex]) loadTrack(0);
  isPlaying ? pauseAudio() : playAudio();
});

fsPrevBtn.addEventListener('click', () => goToTrack(currentIndex - 1, isPlaying));
fsNextBtn.addEventListener('click', () => goToTrack(currentIndex + 1, isPlaying));

fsShuffleBtn.addEventListener('click', () => {
  shuffleOn = !shuffleOn;
  updateShuffleBtn();
  fsShuffleBtn.classList.toggle('is-on', shuffleOn);
});

fsRepeatBtn.addEventListener('click', () => {
  repeatOn = !repeatOn;
  updateRepeatBtn();
  fsRepeatBtn.classList.toggle('is-on', repeatOn);
});

fsProgressTrack.addEventListener('click', (e) => {
  const rect = fsProgressTrack.getBoundingClientRect();
  const ratio = (e.clientX - rect.left) / rect.width;
  if (!audio.duration) return;
  audio.currentTime = ratio * audio.duration;
});

fsVolumeSlider.addEventListener('input', () => {
  audio.volume = Number(fsVolumeSlider.value);
  volumeSlider.value = fsVolumeSlider.value;
});

fsVolMax.addEventListener('click', () => {
  audio.volume = 1;
  fsVolumeSlider.value = 1;
  volumeSlider.value = 1;
});

fsFavBtn.addEventListener('click', () => {
  if (currentTrack[currentIndex]) toggleFavourite(currentTrack[currentIndex]);
  const on = currentTrack[currentIndex] && isFavourite(currentTrack[currentIndex]);
  fsFavBtn.textContent = on ? '♥' : '♡';
  fsFavBtn.classList.toggle('is-on', on);
});

fsLyricsToggle.addEventListener('click', toggleFsLyrics);

fsQueueToggle.addEventListener('click', () => {
  closeFsPlayer();
  setNowTab('queue');
  openNowPanel();
});

albumCoverButton.addEventListener('click', (e) => {
  e.stopPropagation();
  openFsPlayer();
});

expandBtn.addEventListener('click', openFsPlayer);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeFsPlayer();
    nowPanel.classList.remove('open');
  }
});

/* ---------- Keyboard shortcuts ---------- */

function seekBy(seconds) {
  if (!audio.duration) return;
  audio.currentTime = Math.min(Math.max(audio.currentTime + seconds, 0), audio.duration);
}

document.addEventListener('keydown', (e) => {
  const tag = (e.target && e.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return;

  if (e.code === 'Space') {
    e.preventDefault();
    if (!currentTrack.length) {
      playMood(activeMood);
      return;
    }
    if (!currentTrack[currentIndex]) loadTrack(0);
    isPlaying ? pauseAudio() : playAudio();
    return;
  }
  if (e.key === 'ArrowRight') {
    e.preventDefault();
    seekBy(5);
    return;
  }
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    const currentTime = audio.currentTime || 0;
    if (currentTime < 5) goToTrack(currentIndex - 1, isPlaying);
    else seekBy(-5);
  }
});

/* ---------- India clock ---------- */

const clockHours = document.getElementById('clockHours');
const clockMinutes = document.getElementById('clockMinutes');

function updateIndiaClock() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(now);
  const getPart = (type) => parts.find((part) => part.type === type)?.value || '00';
  clockHours.textContent = getPart('hour');
  clockMinutes.textContent = getPart('minute');
}

updateIndiaClock();
setInterval(updateIndiaClock, 1000);

/* ---------- Music cards ---------- */

function createMusicCard(track, onPlay) {
  const wrap = document.createElement('div');
  wrap.className = 'music-card';
  wrap.dataset.key = trackKey(track);

  const art = document.createElement('div');
  art.className = 'music-card-art';
  const img = document.createElement('img');
  img.src = coverOf(track);
  img.alt = '';
  img.loading = 'lazy';
  art.appendChild(img);

  const play = document.createElement('button');
  play.className = 'card-play';
  play.type = 'button';
  play.setAttribute('aria-label', 'Play ' + track.title);
  play.innerHTML = '&#9654;';
  play.addEventListener('click', (e) => {
    e.stopPropagation();
    onPlay();
  });
  art.appendChild(play);

  const heart = document.createElement('button');
  heart.className = 'card-fav' + (isFavourite(track) ? ' is-on' : '');
  heart.type = 'button';
  heart.setAttribute('aria-label', 'Favourite');
  heart.textContent = isFavourite(track) ? '♥' : '♡';
  heart.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFavourite(track);
    heart.textContent = isFavourite(track) ? '♥' : '♡';
    heart.classList.toggle('is-on', isFavourite(track));
  });
  art.appendChild(heart);

  const title = document.createElement('span');
  title.className = 'music-card-title';
  title.textContent = track.title;
  const artist = document.createElement('span');
  artist.className = 'music-card-artist';
  artist.textContent = track.artist;

  wrap.append(art, title, artist);
  if (track.album) {
    const album = document.createElement('span');
    album.className = 'music-card-album';
    album.textContent = track.album;
    wrap.appendChild(album);
  }

  wrap.addEventListener('click', onPlay);
  return wrap;
}

function highlightPlayingCards() {
  const current = currentTrack[currentIndex];
  const key = current ? trackKey(current) : '';
  document.querySelectorAll('.music-card').forEach((card) => {
    card.classList.toggle('is-playing', card.dataset.key === key && isPlaying);
  });
}

/* ---------- Sidebar mood chips ---------- */

function renderMoodChips() {
  const root = document.getElementById('sidebarMoods');
  if (!root) return;
  root.innerHTML = '';
  MOOD_ORDER.forEach((id) => {
    const meta = moodMeta[id];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mood-chip' + (id === activeMood ? ' is-active' : '');
    btn.innerHTML = '<span></span>';
    btn.querySelector('span').textContent = meta.label;
    btn.addEventListener('click', () => setMood(id));
    root.appendChild(btn);
  });
}

/* ---------- Hero ---------- */

function greetingForHour(hour) {
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

function renderHero() {
  const meta = moodMeta[activeMood];
  const tracks = tracksFor(activeMood);

  const hour = Number(new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }).format(new Date()));
  document.getElementById('heroEyebrow').textContent = greetingForHour(hour);
  document.getElementById('heroHeadline').textContent = 'Welcome to Listening Room';
  document.getElementById('heroLede').textContent = 'Pick a mood, press play, and let the music set the tone.';

  const hero = document.getElementById('moodHero');
  const image = meta.image || (tracks[0] && tracks[0].cover) || '';
  if (image) {
    hero.style.backgroundImage =
      `linear-gradient(90deg, rgba(13,13,15,0.92) 0%, rgba(13,13,15,0.6) 48%, rgba(13,13,15,0.25) 100%), url("${image}")`;
  } else {
    hero.style.backgroundImage = '';
  }

  const empty = !tracks.length;
  heroPlayBtn.disabled = empty;
  heroShuffleBtn.disabled = empty;
}

/* ---------- Active mood track grid ---------- */

function renderMoodCards() {
  const grid = document.getElementById('moodCards');
  const empty = document.getElementById('moodEmpty');
  const tracks = tracksFor(activeMood);
  grid.innerHTML = '';
  empty.hidden = tracks.length > 0;
  empty.textContent = moodMeta[activeMood].emptyLine;

  document.getElementById('sectionTitle').textContent = moodMeta[activeMood].label;
  document.getElementById('sectionSub').textContent = moodMeta[activeMood].sectionLine;

  tracks.forEach((track, index) => {
    grid.appendChild(createMusicCard(track, () => playFromMood(activeMood, index, true)));
  });
  highlightPlayingCards();
}

/* ---------- Mood posters ---------- */

function createMoodPoster(id) {
  const meta = moodMeta[id];
  const count = tracksFor(id).length;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'mood-poster';
  btn.dataset.mood = id;
  if (meta.image) btn.style.backgroundImage = `url('${meta.image}')`;
  btn.innerHTML = `
    <span class="mood-poster-name"></span>
    <span class="mood-poster-count"></span>
    <span class="mood-poster-play">&#9654;</span>
  `;
  btn.querySelector('.mood-poster-name').textContent = meta.short;
  btn.querySelector('.mood-poster-count').textContent = count
    ? `${count} song${count === 1 ? '' : 's'}`
    : 'Add songs';
  btn.addEventListener('click', () => {
    setMood(id);
    setView('home');
  });
  return btn;
}

function renderExplore(containerId, excludeActive) {
  const root = document.getElementById(containerId);
  if (!root) return;
  root.innerHTML = '';
  MOOD_ORDER.filter((id) => !excludeActive || id !== activeMood).forEach((id) => {
    root.appendChild(createMoodPoster(id));
  });
}

/* ---------- Home "Recently Played" row ---------- */

function renderHomeCards() {
  const grid = document.getElementById('discoverCards');
  if (!grid) return;
  grid.innerHTML = '';
  const recent = loadRecent();
  const source = recent.length ? recent : allLibraryTracks().slice(0, 6);
  source.slice(0, 6).forEach((track) => {
    grid.appendChild(createMusicCard(track, () => {
      const loc = findTrackLocation(track);
      if (tracksFor(loc.mood).length) playFromMood(loc.mood, loc.index, true);
      else {
        queueMood = loc.mood;
        currentTrack = [track];
        goToTrack(0, true);
      }
    }));
  });
}

/* ---------- Discover page ---------- */

function renderDiscover() {
  const grid = document.getElementById('discoverSearchCards');
  if (!grid) return;
  grid.innerHTML = '';
  allLibraryTracks().slice(0, 18).forEach((track) => {
    grid.appendChild(createMusicCard(track, () => playFromMood(track.mood, track.index, true)));
  });
}

/* ---------- Playlists page ---------- */

function renderPlaylistsPage() {
  const root = document.getElementById('playlistCards');
  root.innerHTML = '';
  MOOD_ORDER.forEach((id) => {
    const meta = moodMeta[id];
    const tracks = tracksFor(id);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'playlist-card';
    const cover = tracks[0] ? coverOf(tracks[0]) : 'assets/covers/placeholder-cover.svg';
    card.innerHTML = `<img alt="" src="${cover}"><div><h3></h3><p></p></div>`;
    card.querySelector('h3').textContent = meta.playlistName;
    card.querySelector('p').textContent = `${meta.label} · ${tracks.length} tracks`;
    card.addEventListener('click', () => {
      setMood(id);
      setView('home');
      if (tracks.length) playMood(id);
    });
    root.appendChild(card);
  });
}

/* ---------- Favourites / Recent pages ---------- */

function renderFavourites() {
  const grid = document.getElementById('favouriteCards');
  const empty = document.getElementById('favEmpty');
  const list = loadFavourites();
  grid.innerHTML = '';
  empty.hidden = list.length > 0;
  list.forEach((track) => {
    const loc = findTrackLocation(track);
    grid.appendChild(createMusicCard(track, () => {
      if (loc.list.length && loc.list[loc.index]) playFromMood(loc.mood, loc.index, true);
      else {
        queueMood = loc.mood;
        currentTrack = [track];
        goToTrack(0, true);
      }
    }));
  });
}

function renderRecent() {
  const grid = document.getElementById('recentCards');
  const empty = document.getElementById('recentEmpty');
  const list = loadRecent();
  grid.innerHTML = '';
  empty.hidden = list.length > 0;
  list.forEach((track) => {
    const loc = findTrackLocation(track);
    grid.appendChild(createMusicCard(track, () => {
      if (tracksFor(loc.mood).length) playFromMood(loc.mood, loc.index, true);
    }));
  });
}

/* ---------- Now-playing panel ---------- */

function renderNowPlaying() {
  const track = currentTrack[currentIndex];
  if (!track) {
    nowCurrent.innerHTML = '';
    nowQueueList.innerHTML = '';
    return;
  }

  nowCurrent.innerHTML = `
    <img src="${coverOf(track)}" alt="">
    <div class="now-current-meta">
      <div class="now-current-title"></div>
      <div class="now-current-artist"></div>
    </div>
  `;
  nowCurrent.querySelector('.now-current-title').textContent = track.title;
  nowCurrent.querySelector('.now-current-artist').textContent = track.artist;

  nowQueueList.innerHTML = '';
  currentTrack.forEach((t, index) => {
    if (index === currentIndex) return;
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'now-row';
    row.innerHTML = `
      <img src="${coverOf(t)}" alt="">
      <span class="now-row-meta">
        <span class="now-row-title"></span>
        <span class="now-row-artist"></span>
      </span>
      <span class="now-row-more">&#8942;</span>
    `;
    row.querySelector('.now-row-title').textContent = t.title;
    row.querySelector('.now-row-artist').textContent = t.artist;
    row.addEventListener('click', () => goToTrack(index, true));
    nowQueueList.appendChild(row);
  });
}

/* ---------- View / mood switching ---------- */

function setMood(moodId) {
  if (!moodMeta[moodId]) return;
  activeMood = moodId;
  document.documentElement.dataset.mood = moodId;
  renderMoodChips();
  renderHero();
  renderMoodCards();
  renderExplore('exploreMoods', true);
  renderExplore('moodsPageGrid', false);
}

function setView(view) {
  currentView = view;
  document.documentElement.dataset.view = view;
  document.querySelectorAll('.view').forEach((el) => {
    el.classList.toggle('is-visible', el.dataset.viewPanel === view);
  });
  document.querySelectorAll('.nav-item').forEach((el) => {
    el.classList.toggle('is-active', el.dataset.view === view);
  });
  if (view === 'discover') renderDiscover();
  if (view === 'playlists') renderPlaylistsPage();
  if (view === 'favourites') renderFavourites();
  if (view === 'recent') renderRecent();
  if (view === 'moods') renderExplore('moodsPageGrid', false);
  if (view === 'home') renderHomeCards();
}

document.querySelectorAll('.nav-item').forEach((el) => {
  if (el.tagName !== 'BUTTON') return;
  el.addEventListener('click', () => setView(el.dataset.view));
});

document.querySelectorAll('.side-link, .see-all').forEach((el) => {
  el.addEventListener('click', () => setView(el.dataset.view));
});

heroPlayBtn.addEventListener('click', () => playMood(activeMood, false));
heroShuffleBtn.addEventListener('click', () => playMood(activeMood, true));

/* ---------- Library search ---------- */

librarySearch.addEventListener('input', () => {
  const q = librarySearch.value.trim().toLowerCase();
  const section = document.getElementById('librarySearchResults');
  const grid = document.getElementById('librarySearchGrid');
  if (!q) {
    section.hidden = true;
    grid.innerHTML = '';
    return;
  }
  const hits = allLibraryTracks().filter((t) =>
    `${t.title} ${t.artist} ${t.album || ''}`.toLowerCase().includes(q)
  );
  section.hidden = false;
  grid.innerHTML = '';
  hits.forEach((track) => {
    grid.appendChild(createMusicCard(track, () => playFromMood(track.mood, track.index, true)));
  });
});

audio.addEventListener('play', highlightPlayingCards);
audio.addEventListener('pause', highlightPlayingCards);

/* ---------- Boot ---------- */

setMood(DEFAULT_MOOD);
setView('home');
if (currentTrack.length) loadTrack(0);
else {
  trackTitleEl.textContent = 'No track loaded';
  trackArtistEl.textContent = 'Choose a mood with songs, or add tracks in playlists.js';
}