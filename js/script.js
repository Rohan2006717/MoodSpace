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
const coverOverlay = document.getElementById('coverOverlay');
const coverOverlayImage = document.getElementById('coverOverlayImage');
const coverOverlayImg = document.querySelector('#coverOverlayImage img');
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
  const playIcon = playBtn.querySelector('.icon-play');
  const pauseIcon = playBtn.querySelector('.icon-pause');
  if (playIcon) playIcon.hidden = playing;
  if (pauseIcon) pauseIcon.hidden = !playing;
}

function loadTrack(index, autoplay = false) {
  if (!currentTrack.length) return;
  currentIndex = ((index % currentTrack.length) + currentTrack.length) % currentTrack.length;
  const track = currentTrack[currentIndex];

  trackTitleEl.textContent = track.title;
  trackArtistEl.textContent = track.artist;
  coverArtSmallImg.src = coverOf(track);
  coverOverlayImg.src = coverOf(track);
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
}

function playAudio() {
  audio.play();
  isPlaying = true;
  playBtn.setAttribute('aria-label', 'Pause');
  setPlayIcons(true);
  highlightPlayingCards();
}

function pauseAudio() {
  audio.pause();
  isPlaying = false;
  playBtn.setAttribute('aria-label', 'Play');
  setPlayIcons(false);
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
  progressFill.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
  timeElapsedEl.textContent = formatTime(audio.currentTime);
  updateLyricsSync(audio.currentTime);
});

audio.addEventListener('loadedmetadata', () => {
  timeTotalEl.textContent = formatTime(audio.duration);
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

/* ---------- Cover overlay ---------- */

function openCoverOverlay() {
  coverOverlay.classList.add('open');
  coverOverlay.setAttribute('aria-hidden', 'false');
}

function closeCoverOverlay() {
  coverOverlay.classList.remove('open');
  coverOverlay.setAttribute('aria-hidden', 'true');
}

albumCoverButton.addEventListener('click', (e) => {
  e.stopPropagation();
  openCoverOverlay();
});

expandBtn.addEventListener('click', openCoverOverlay);
coverOverlayImage.addEventListener('click', closeCoverOverlay);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeCoverOverlay();
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
      `linear-gradient(90deg, rgba(13,13,15,0.92) 0%, rgba(13,13,15,0.6) 48%, rgba(13,13,15,0.25) 100%), url('${image}')`;
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