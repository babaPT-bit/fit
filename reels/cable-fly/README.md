# Cable fly comparison reel

1080×1920, ~30 s Instagram Reel comparing high→low, mid and low→high cable flies.
Story: all three together → spotlight each variant with a slowed-down "peak" moment → summary.
Top: figure doing the fly on a cable crossover (chest regions light up with load).
Bottom: load per muscle region across the rep, plus each variant's share of the work.

- `model.js`: biomechanics model (3D shoulder, cable moment arm, torque-axis split into
  upper / mid / lower chest and front delt). All the numbers in the video come from here.
- `scene.html`: canvas scene; `drawFrame(t)` draws the frame at time `t`. Open it in a browser to preview.
- `render.js`: renders every frame with Playwright and encodes it with ffmpeg.
- `CAPTION.md`: the post caption.
- `voice/script.json`: voiceover lines (the scene timing follows their length).
  `voice/tts.py` regenerates the audio with the offline Kokoro TTS
  (`pip install kokoro-onnx soundfile`; model files from the kokoro-onnx GitHub releases).

Outputs in `out/`: `cable-fly-reel.mp4` (voice + captions), `cable-fly-reel-clean.mp4`
(no captions/audio, for your own edit), `cable-fly-voiceover.m4a`, `cable-fly-captions.srt`.

Render: `python3 voice/tts.py <kokoro.onnx> <voices.bin> am_michael 1.1` then `node render.js`
Preview stills: `node render.js --stills 2.0,6.0 <dir>`
