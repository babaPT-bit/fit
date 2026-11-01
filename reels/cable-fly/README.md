# Cable fly comparison reel

1080×1920 Instagram Reel comparing high→low, mid and low→high cable flies.
Top: figure doing the fly on a cable crossover (chest regions light up with load).
Bottom: load per muscle region across the rep, plus each variant's share of the work.

- `model.js`: biomechanics model (3D shoulder, cable moment arm, torque-axis split into
  upper / mid / lower chest and front delt). All the numbers in the video come from here.
- `scene.html`: canvas scene; `drawFrame(t)` draws the frame at time `t`. Open it in a browser to preview.
- `render.js`: renders every frame with Playwright and encodes it with ffmpeg.
- `CAPTION.md`: the post caption.

Render: `node render.js` → `out/cable-fly-reel.mp4`
Preview stills: `node render.js --stills 2.0,6.0 <dir>`
