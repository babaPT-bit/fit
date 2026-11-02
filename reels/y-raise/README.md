# Y raises × 30 days reel

~33 s, 1080×1920 Instagram Reel with voiceover and burned-in captions.
1. Hook: chest-supported Y raise, lower traps + delts highlighted.
2. 30-day timeline (day 1 / 7 / 14 / 30): posture figure straightens against a plumb line;
   stat cards for posture, breathing, overhead press %, upper-back size %; daily Y raise weight 2 → 4 kg.
3. Progression: bench → bent-over dumbbell → cable, each with its tension curve
   (from `model.js`: shoulder torque across the rep), highlighted as the voice names it.

- `model.js`: torque model for the three variants.
- `scene.html`: canvas scene (`drawFrame(t)`); timing follows `voice/lines.js`.
- `voice/script.json`: voiceover text → `python3 voice/tts.py <kokoro.onnx> <voices.bin> am_michael 1.12`.
- `render.js`: `node render.js` → `out/` (voiced reel, clean reel, voiceover .m4a, captions .srt).
- `CAPTION.md`: post caption.
