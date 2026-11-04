# Generates the voiceover lines with Kokoro (local, offline) and writes timings.
# usage: python3 voice/tts.py <kokoro.onnx> <voices.bin> [voice] [speed]
import json, sys, os
import soundfile as sf
from kokoro_onnx import Kokoro
here = os.path.dirname(os.path.abspath(__file__))
model, voices = sys.argv[1], sys.argv[2]
voice = sys.argv[3] if len(sys.argv) > 3 else "am_michael"
speed = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
k = Kokoro(model, voices)
lines = json.load(open(os.path.join(here, "script.json")))
out = []
for ln in lines:
    samples, sr = k.create(ln["text"], voice=ln.get("voice", voice), speed=ln.get("speed", speed), lang="en-us")
    path = os.path.join(here, f"{ln['id']}.wav")
    sf.write(path, samples, sr)
    out.append({**ln, "file": f"{ln['id']}.wav", "dur": round(len(samples) / sr, 3)})
    print(ln["id"], out[-1]["dur"])
json.dump(out, open(os.path.join(here, "lines.json"), "w"), indent=1)
with open(os.path.join(here, "lines.js"), "w") as f:
    f.write("window.VOICE = " + json.dumps(out) + ";\n")
