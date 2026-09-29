/* =========================================================
   Mood copy & visual identity — edit here, not in the UI.
   Track lists live in playlists.js (moods.chill, etc.).
   ========================================================= */

const MOOD_ORDER = ['chill', 'motivated', 'sad', 'happy', 'bollywood'];
const DEFAULT_MOOD = 'happy';

const moodMeta = {
  chill: {
    id: 'chill',
    label: 'Chill / Relaxed',
    short: 'Chill',
    headline: 'Slow down. Stay a while.',
    description: 'Quiet tempos, late light, and songs that don’t ask anything of you.',
    sectionLine: 'Music for when the day can wait.',
    emptyLine: 'Nothing here yet. Add tracks to moods.chill in js/playlists.js.',
    playlistName: 'Evening Window',
    image: 'assets/backgrounds/bg-2.png'
  },
  motivated: {
    id: 'motivated',
    label: 'Motivated / Hyped',
    short: 'Motivated',
    headline: 'Turn it up. Get moving.',
    description: 'Forward motion — the kind of mix you put on when you need a push.',
    sectionLine: 'Songs for when you want more from the hour.',
    emptyLine: 'Nothing here yet. Add tracks to moods.motivated in js/playlists.js.',
    playlistName: 'Open Road',
    image: 'assets/backgrounds/bg-3.png'
  },
  sad: {
    id: 'sad',
    label: 'Sad / Broken',
    short: 'Sad',
    headline: 'Sit with it. You’re not alone.',
    description: 'Grey-hour songs for the feelings you don’t need to explain.',
    sectionLine: 'Music for when it hurts a little.',
    emptyLine: 'Nothing here yet. Add tracks to moods.sad in js/playlists.js.',
    playlistName: 'Blue Room',
    image: 'assets/backgrounds/bg-4.png'
  },
  happy: {
    id: 'happy',
    label: 'Happy',
    short: 'Happy',
    headline: 'Feel good. Play loud.',
    description: 'Sun on the floor, extra spice, and a playlist that refuses to sit still.',
    sectionLine: 'Songs for when you’re feeling good.',
    emptyLine: 'Nothing here yet. Add tracks to moods.happy in js/playlists.js.',
    playlistName: 'Chatpate Hour',
    image: 'assets/backgrounds/new-bg.png'
  },
  bollywood: {
    id: 'bollywood',
    label: 'Bollywood',
    short: 'Bollywood',
    headline: 'Desi beats. Big feels.',
    description: 'Bollywood hits for dancing, dreaming, and everything in between.',
    sectionLine: 'Music for the masala in your life.',
    emptyLine: 'Nothing here yet. Add tracks to moods.bollywood in js/playlists.js.',
    playlistName: 'Bollywood Beats',
    image: 'assets/backgrounds/mood-jazz-bg.png'
  }
};