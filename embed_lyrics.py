import json
import re

with open('js/playlists.js', 'r', encoding='utf-8') as f:
    content = f.read()

def replacer(match):
    lyrics_src = match.group(1)
    try:
        with open(lyrics_src, 'r', encoding='utf-8') as lf:
            lyrics_text = lf.read()
            # Escape for JSON/JS string
            lyrics_text_escaped = json.dumps(lyrics_text)
            return f'lyricsText: {lyrics_text_escaped}'
    except Exception as e:
        return match.group(0)

# Replace lyricsSrc: "path/to/file.lrc" with lyricsText: "..."
new_content = re.sub(r'lyricsSrc:\s*"([^"]+\.lrc)"', replacer, content)

with open('js/playlists.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Lyrics embedded.")
