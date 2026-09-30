# 🎧 Listening Room

A mood-based interactive music player that lets you pick a mood, press play, and let the music set the tone.

The website provides a complete music-listening experience with mood-based playlists, album artwork, synchronized lyrics, online search, playback controls, favourites, recently played history, and a fullscreen player — all wrapped in a modern, minimal interface.

## 🌐 Live Demo

**[Listening Room](https://mood-jazz-gauri.vercel.app/)**

## 📂 Repository

**[GitHub Repository](https://github.com/Rohan2006717/MoodSpace)**

---

## ✨ Features

### 🎵 Music Player

* Play and pause tracks
* Previous and next track controls
* Automatic transition to the next song
* Real-time playback progress
* Current time and total duration display
* Clickable progress bar for seeking
* Current song title and artist display
* Volume control slider
* Shuffle and repeat modes
* Keyboard shortcuts (`Space` to play/pause, `←`/`→` to seek)

### 🎭 Mood-Based Library

* Five curated moods: **Chill / Relaxed**, **Motivated / Hyped**, **Sad / Broken**, **Happy**, and **Bollywood**
* Each mood has its own playlist, visual identity, and background artwork
* Mood posters on the home page for quick switching
* Sidebar mood chips for one-click mood changes
* Empty moods show helpful hints for adding tracks

### 🔍 Search

* **Library search** — instantly filter songs, artists, albums, and moods from your local collection
* **Online search** — search millions of tracks through the **Audius API**
* Debounced live search as you type
* Online tracks stream directly from Audius
* Online lyrics fetched automatically from **LRCLIB**

### 📜 Playlists

* Mood-based playlists with album artwork
* Dedicated **Your Playlists** page
* Playlist cards with track counts
* Tracks are dynamically generated using JavaScript
* Playlist data is separated from player logic for easier maintenance

### ❤️ Favourites & Recently Played

* Favourite any track with a heart button (persisted in `localStorage`)
* Dedicated **Liked Songs** page
* **Recently Played** history (last 24 tracks, persisted in `localStorage`)
* Recently played row on the home page

### 🎤 Synchronized Lyrics

* Dedicated lyrics panel with Queue/Lyrics tabs
* Supports `.lrc` lyric files and embedded `lyricsText`
* Lyrics synchronize with the current playback position
* Active lyric line highlighting
* Click any lyric line to seek to that moment
* Online lyrics fetched from **LRCLIB** for streamed tracks
* Fullscreen player includes auto-scrolling lyrics with a manual **Sync** button

### 🖥️ Fullscreen Player

* Expanded album-cover view with blurred background
* Full transport controls (shuffle, previous, play/pause, next, repeat)
* Volume slider with max-volume shortcut
* Toggleable lyrics panel with auto-follow scrolling
* Queue access from fullscreen mode

### 🕐 Interface

* Live India time display in the sidebar
* Time-based greeting in the hero section ("Good morning", "Good evening", etc.)
* Full-screen background artwork per mood
* Glassmorphism-style player interface
* Responsive layout
* Modern minimal design with Fraunces + Source Sans 3 typography

---

## 🛠️ Technologies Used

* **HTML5** — Page structure and semantic elements
* **CSS3** — Layout, responsive design, animations, glassmorphism effects
* **JavaScript (ES6+)** — Music player logic and dynamic UI
* **HTML5 Audio API** — Local audio playback
* **Audius API** — Online track search and streaming
* **LRCLIB API** — Online synchronized lyrics
* **LRC** — Timestamped lyrics synchronization
* **localStorage** — Favourites and recently played persistence
* **Google Fonts** — Fraunces & Source Sans 3 typography
* **Python** — `embed_lyrics.py` helper script for embedding lyrics
* **Vercel** — Deployment
* **Git & GitHub** — Version control

---

## 📁 Project Structure

```text
MoodSpace/
│
├── assets/
│   ├── audio/
│   ├── backgrounds/
│   ├── covers/
│   ├── fonts/
│   └── lyrics/
│
├── css/
│   └── style.css
│
├── js/
│   ├── moods.js
│   ├── playlists.js
│   ├── script.js
│   └── search.js
│
├── embed_lyrics.py
├── index.html
└── README.md
```

### `index.html`

Contains the main structure of the application, including:

* Sidebar with navigation, mood chips, and playlists
* Home, Search, Moods, Playlists, Favourites, and Recently Played views
* Top search bar
* Now-playing panel with Queue and Lyrics tabs
* Player bar with transport controls, progress, and volume
* Online search panel (Audius)
* Fullscreen player overlay

### `js/moods.js`

Contains the mood metadata and visual identity for all five moods:

* Mood order and default mood
* Labels, headlines, descriptions, and section lines
* Playlist names and background images
* Empty-state messages

### `js/playlists.js`

Contains the music library organized by mood:

```javascript
const moods = {
  chill: [ /* tracks */ ],
  motivated: [ /* tracks */ ],
  sad: [],
  happy: [ /* tracks */ ],
  bollywood: []
};
```

Each track can contain:

* Title
* Artist
* Audio source
* Cover artwork
* `lyricsText` (embedded LRC) or `lyricsSrc` (path to `.lrc` file)
* Album (optional)

### `js/script.js`

Handles the core application functionality, including:

* Track loading and mood switching
* Play/pause, previous/next navigation
* Progress tracking and audio seeking
* Shuffle and repeat modes
* Volume control
* Favourites and recently played (localStorage)
* Lyrics loading, parsing, and synchronization
* Fullscreen player
* Queue panel
* Library search
* Keyboard shortcuts
* India clock
* Dynamic card rendering and mood posters

### `js/search.js`

Handles online search and streaming:

* Audius API search and stream resolution
* LRCLIB lyrics fetching
* Search panel open/close and debounced live search
* Online track playback integration

### `css/style.css`

Controls:

* Overall visual design
* Responsive layout
* Player interface
* Mood-based theming
* Playlist and card styling
* Lyrics panel
* Fullscreen player
* Animations and transitions
* Glassmorphism effects

### `embed_lyrics.py`

A Python helper script that converts `lyricsSrc` references in `js/playlists.js` into embedded `lyricsText` strings:

```bash
python3 embed_lyrics.py
```

---

## 🚀 Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/Rohan2006717/MoodSpace.git
```

### 2. Navigate into the project

```bash
cd MoodSpace
```

### 3. Run the project

Since this is a static HTML/CSS/JavaScript project, it can be opened directly through `index.html`.

For the best development experience, use a local server such as **VS Code Live Server**.

---

## 🎧 Adding a New Track

To add a new song:

1. Add the audio file inside:

```text
assets/audio/
```

2. Add the album artwork inside:

```text
assets/covers/
```

3. (Optional) Add the lyrics `.lrc` file inside:

```text
assets/lyrics/
```

4. Add the track information to the matching mood array in:

```text
js/playlists.js
```

Example:

```javascript
{
    title: "Song Name",
    artist: "Artist Name",
    src: "assets/audio/song.mp3",
    cover: "assets/covers/song.jpg",
    lyricsSrc: "assets/lyrics/song.lrc"
}
```

You can also embed lyrics directly using `lyricsText`:

```javascript
{
    title: "Song Name",
    artist: "Artist Name",
    src: "assets/audio/song.mp3",
    cover: "assets/covers/song.jpg",
    lyricsText: "[00:00.00] First line\n[00:05.00] Second line\n"
}
```

To convert all `lyricsSrc` references to embedded `lyricsText`, run:

```bash
python3 embed_lyrics.py
```

---

## 🎼 Current Playlist

The library is organized into five moods:

### 😌 Chill / Relaxed

* Talha Anjum — Touchbase
* Seedhe Maut — Discord Anthem

### 🔥 Motivated / Hyped

* Eminem — The Way I Am

### 😢 Sad / Broken

* *Empty — add tracks to `moods.sad` in `js/playlists.js`*

### 😄 Happy

A collection of jazz, pop, soul, and vintage-inspired tracks from artists including:

* Elvis Presley
* Madonna
* Stephen Sanchez
* Lesley Gore
* Connie Francis
* Bee Gees
* Paul Anka
* Frank Sinatra
* Frankie Valli
* Michael Bublé
* Dean Martin
* Ella Fitzgerald
* Louis Armstrong
* Etta James
* Billie Holiday
* Édith Piaf
* Eartha Kitt
* And more

### 🎬 Bollywood

* *Empty — add tracks to `moods.bollywood` in `js/playlists.js`*

---

## 🎯 Project Highlights

This project was built to go beyond a simple static music webpage by implementing an interactive browser-based music player.

Key implementation highlights include:

* Mood-based library architecture
* Dynamic playlist rendering
* State-based player controls
* Multiple playback sources (local + online streaming)
* Automatic track advancement
* Real-time progress updates
* Timestamp-based lyric synchronization
* Online search via Audius API
* Online lyrics via LRCLIB API
* Favourites and recently played persistence
* Fullscreen player with auto-scrolling lyrics
* Keyboard shortcuts
* Responsive UI design
* Separation of mood metadata, playlist data, and player functionality

---

## 🔮 Future Improvements

Potential improvements for future versions:

* [ ] Multiple playlists (user-created)
* [ ] Playlist creation UI
* [ ] Improved mobile player controls
* [ ] Persistent playback state
* [ ] Audio visualizer
* [ ] Social sharing
* [ ] More moods
* [ ] Offline caching of online tracks

---

## 👨‍💻 Author

**Rohan Singh**

B.Tech Mechanical Engineering
Delhi Technological University

### Links

* **GitHub:** [Rohan2006717](https://github.com/Rohan2006717)
* **Live Project:** [Listening Room](https://mood-jazz-gauri.vercel.app/)

---

⭐ If you like the project, consider giving the repository a star!