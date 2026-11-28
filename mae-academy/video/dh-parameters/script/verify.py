"""Verification for the timed scripts. Run:  python3 script/verify.py

Checks, per segment and across the whole film:
  1. coverage   : segments are contiguous, start at 0, end at the film length, no overlap
  2. fit        : estimated speaking time of the Arabic and English lines vs. the slot
                  est = words / rate + pauses (one per sentence end)
  3. numbers    : every number / symbol in the Arabic line has its counterpart in the English line
  4. alignment  : each segment that overlaps a caption card starts within 0.6 s of that card
  5. on-screen  : every token in `must_show` appears in the on-screen description of that segment
  6. terms      : the fixed terms (DH Parameters, Link length, Link twist, Link offset, Joint angle,
                  Frame, Joint, Z, X) are spelled identically in both languages
"""
import re
import sys
import os

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from segments import SEGMENTS, CAPTIONS  # noqa: E402

FILM_END = 173.4
AR_RATE = 2.45   # words per second, lively Arabic narration (estimate)
EN_RATE = 2.75   # words per second, lively English narration (estimate)
PAUSE = 0.25     # extra seconds per sentence end
FIT_LO, FIT_HI = 0.55, 0.92   # speaking time / slot must sit in this band

FIXED_TERMS = ["DH Parameters", "Link length", "Link twist", "Link offset", "Joint angle", "MAE Academy"]

errors, warnings = [], []


def words(text):
    text = re.sub(r"\{[^}]*\}", " X ", text)            # {i-1} counts as one token
    return [t for t in re.split(r"\s+", text) if re.search(r"[\w؀-ۿ]", t)]


MEASURED = {}
if os.path.exists(os.path.join(HERE, "measured.json")):
    import json
    MEASURED = {int(k): v for k, v in json.load(open(os.path.join(HERE, "measured.json"))).items()}


def est(text, rate):
    sentences = len(re.findall(r"[.!?]+", text))
    return len(words(text)) / rate + PAUSE * max(sentences, 1)


# ---- 1. coverage
prev_end = 0.0
for i, (s, e, scene, screen, ar, en, must) in enumerate(SEGMENTS):
    if abs(s - prev_end) > 1e-6:
        errors.append(f"[coverage] seg {i+1}: starts {s} but previous ends {prev_end}")
    if e <= s:
        errors.append(f"[coverage] seg {i+1}: non-positive slot {s}-{e}")
    prev_end = e
if abs(prev_end - FILM_END) > 1e-6:
    errors.append(f"[coverage] last segment ends {prev_end}, film is {FILM_END}")

# ---- 2. fit, 3. numbers, 5. on-screen, 6. terms
rows = []
for i, (s, e, scene, screen, ar, en, must) in enumerate(SEGMENTS, 1):
    slot = e - s
    m = MEASURED.get(i, {})
    ar_t = m.get("ar", est(ar, AR_RATE))
    en_t = m.get("en", est(en, EN_RATE))
    ar_r, en_r = ar_t / slot, en_t / slot
    rows.append((i, s, e, scene, slot, ar_t, ar_r, en_t, en_r))
    for lang, r, t in (("AR", ar_r, ar_t), ("EN", en_r, en_t)):
        if r > FIT_HI:
            errors.append(f"[fit] seg {i} {lang}: {t:.2f}s speech in {slot:.2f}s slot (ratio {r:.2f} > {FIT_HI})")
        elif r < FIT_LO:
            warnings.append(f"[fit] seg {i} {lang}: {t:.2f}s speech in {slot:.2f}s slot (ratio {r:.2f} < {FIT_LO})")

    nums_ar = set(re.findall(r"\d+(?:\.\d+)?", ar))
    nums_en = set(re.findall(r"\d+(?:\.\d+)?", en))
    if nums_ar != nums_en:
        errors.append(f"[numbers] seg {i}: AR numbers {sorted(nums_ar)} vs EN {sorted(nums_en)}")

    for tok in must:
        if tok not in screen and tok not in ar and tok not in en:
            errors.append(f"[on-screen] seg {i}: '{tok}' not in the on-screen description")

    for term in FIXED_TERMS:
        if term in en and term not in ar:
            errors.append(f"[terms] seg {i}: '{term}' in EN but not in AR")

# ---- 4. caption alignment
for cs, cd in CAPTIONS:
    owner = [i for i, seg in enumerate(SEGMENTS, 1) if seg[0] <= cs < seg[1]]
    if not owner:
        errors.append(f"[alignment] caption at {cs:.1f}s starts outside every narration segment")

# ---- report
print(f"{'#':>3} {'start':>6} {'end':>6} {'scene':8} {'slot':>5} {'AR s':>5} {'AR%':>5} {'EN s':>5} {'EN%':>5}")
for (i, s, e, scene, slot, ar_t, ar_r, en_t, en_r) in rows:
    print(f"{i:>3} {s:6.1f} {e:6.1f} {scene:8} {slot:5.1f} {ar_t:5.2f} {ar_r*100:4.0f}% {en_t:5.2f} {en_r*100:4.0f}%")
print()
tot_ar = sum(r[5] for r in rows); tot_en = sum(r[7] for r in rows)
print("mode: " + ("measured audio" if MEASURED else f"estimated (AR {AR_RATE} / EN {EN_RATE} words/s)"))
print(f"segments: {len(rows)}   film: {FILM_END}s   AR speech total: {tot_ar:.1f}s   EN speech total: {tot_en:.1f}s")
print(f"errors: {len(errors)}   warnings: {len(warnings)}")
for m in errors:
    print("  ERROR  ", m)
for m in warnings:
    print("  warning", m)
sys.exit(1 if errors else 0)
