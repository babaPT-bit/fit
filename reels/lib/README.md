# 3D reel studio

Shared setup for the 3D exercise reels (`scap-pushup/`, `dead-hang/`):
- `studio.js`: three.js stage (lights, floor, fog), clay athlete built from simple shapes with
  muscles that glow (`serratus`, `scap`, `lat`, `forearm`, `delt`, `pec`, `trap`), camera shots,
  a timeline driven by the voiceover, and burned-in captions.
- `render3d.js`: `node lib/render3d.js <reel>` renders `<reel>/out/<reel>.mp4`, a single video
  with the voiceover and captions. `--stills 2,10 <dir>` saves preview frames.
- `three.module.min.js`: three.js r160 (MIT, see `three.LICENSE`).

Each reel folder has `scene.html` (poses, camera shots and glow per voice line) and
`voice/script.json`. To regenerate the voice, run
`python3 voice/tts.py <kokoro.onnx> <voices.bin> am_michael 1.1` (offline Kokoro TTS).
