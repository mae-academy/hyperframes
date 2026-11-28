"""Writes script-ar.md, script-en.md and verification-report.md from segments.py (run verify.py first)."""
import os, subprocess, json, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from segments import SEGMENTS

def tc(t):
    m, s = divmod(t, 60)
    return f"{int(m):d}:{s:04.1f}"

ev = json.load(open(os.path.join(HERE, "evidence.json"), encoding="utf-8"))
scene_ar = {"intro": "المقدمة", "hook": "السؤال", "diagram": "الشرح", "summary": "الملخص", "example": "المثال", "outro": "الخاتمة"}
scene_en = {"intro": "Intro", "hook": "Hook", "diagram": "Explanation", "summary": "Summary", "example": "Worked example", "outro": "Outro"}

def doc(lang):
    title = "سكريبت الفيديو (عربي)" if lang == "ar" else "Video script (English)"
    out = [f"# {title}", "", "DH Parameters · 173.4 s · 1920×1080 · 60 fps", "",
           "| الوقت | المشهد | ما يظهر | النص |" if lang == "ar" else "| Time | Scene | On screen | Narration |",
           "|---|---|---|---|"]
    prev = None
    for i, (s, e, scene, screen, ar, en, must) in enumerate(SEGMENTS, 1):
        sc = (scene_ar if lang == "ar" else scene_en)[scene]
        line = ar if lang == "ar" else en
        out.append(f"| {tc(s)} – {tc(e)} | {sc} | {screen} | {line} |")
    return "\n".join(out) + "\n"

open(os.path.join(HERE, "script-ar.md"), "w", encoding="utf-8").write(doc("ar"))
open(os.path.join(HERE, "script-en.md"), "w", encoding="utf-8").write(doc("en"))
rep = subprocess.run([sys.executable, os.path.join(HERE, "verify.py")], capture_output=True, text=True).stdout
frames = ["| # | Narration claim | Frame check (snapshot inside the slot) |", "|---|---|---|"]
for i, (s, e, *_r) in enumerate(SEGMENTS, 1):
    if str(i) in ev:
        claim, shot = ev[str(i)]
        frames.append(f"| {i} | {claim} | {shot} |")
open(os.path.join(HERE, "verification-report.md"), "w", encoding="utf-8").write(
    "# Verification report\n\n## Timing and text checks (verify.py)\n\n```\n" + rep + "```\n\n"
    "Speech times are **estimates** (words ÷ rate + pauses). To check the real voice, generate each line, "
    "write the measured seconds to `script/measured.json` as `{\"<segment number>\": {\"ar\": s, \"en\": s}}`, "
    "and run `python3 script/verify.py` again.\n\n## Claim vs. frame check\n\n" + "\n".join(frames) + "\n")
print("written")
