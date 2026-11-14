#!/usr/bin/env python3
"""Script -> voice.mp3 + data.json for the Remotion stick-man video.

    python3 generate.py            # real narration via edge-tts (needs network)
    python3 generate.py --silent   # timing estimated from word count, silent audio

Every paragraph (line) of script.txt becomes one scene. Nothing in the script is
dropped: the full text is shown as captions, and every researcher name, year and
key term is surfaced as an on-screen tag.
"""
import argparse
import asyncio
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SCRIPT = ROOT / "script.txt"
VOICE_OUT = ROOT / "voice.mp3"
DATA_OUT = ROOT / "data.json"

FPS = 30
WIDTH, HEIGHT = 1920, 1080
GAP = 0.45  # seconds of silence after each paragraph
TAIL = 1.5  # seconds of silence after the last paragraph
SAMPLE_RATE = 44100
VOICE = os.environ.get("TTS_VOICE", "en-US-AndrewNeural")
RATE = os.environ.get("TTS_RATE", "-4%")
WORDS_PER_SEC = 2.6  # used only by --silent

# --------------------------------------------------------------------------
# Visual rules: first matching rule (in this order) sets the scene kind/variant.
# A paragraph with no match keeps the previous paragraph's kind/variant.
# --------------------------------------------------------------------------
RULES = [
    (r"grassland and scattered", "grass", "walk"),
    (r"hand drifts", "phone", "hand"),
    (r"story gets stranger", "brain", "dopamine"),
    (r"pleasure chemical", "brain", "dopamine"),
    (r"olds and peter milner", "rat", "lever"),
    (r"kent berridge", "brain", "pleasure"),
    (r"wanting and liking", "brain", "wl"),
    (r"strange thing to sit with", "brain", "crave"),
    (r"wolfram schultz", "monkey", "juice"),
    (r"added a tone", "monkey", "tone"),
    (r"juice failed", "monkey", "miss"),
    (r"prediction error", "monkey", "error"),
    (r"certainty is boring", "monkey", "surprise"),
    (r"b\. f\. skinner", "slot", "pigeons"),
    (r"variable ratio", "slot", "name"),
    (r"grassland again", "grass", "bush"),
    (r"natural slot machine", "slot", "ancestors"),
    (r"pull down to refresh", "feed", "refresh"),
    (r"apps did not invent", "feed", "hunger"),
    (r"one more piece of the puzzle", "feed", "endless"),
    (r"charnov", "forage", "bird"),
    (r"xerox parc", "forage", "pages"),
    (r"information, to your brain, is food", "forage", "food"),
    (r"a real bush runs out", "feed", "endless"),
    (r"only half of the story", "tribe", "group"),
    (r"lone human", "tribe", "group"),
    (r"robin dunbar", "tribe", "gossip"),
    (r"eisenberger", "tribe", "ball"),
    (r"people left out", "tribe", "hurt"),
    (r"red number", "tribe", "badge"),
    (r"absence of a message", "tribe", "absence"),
    (r"here is the twist", "mismatch", "broken"),
    (r"nothing is wrong with your brain", "mismatch", "machine"),
    (r"mountain range", "mismatch", "drive"),
    (r"how to destroy", "advice", "steer"),
    (r"start by noticing", "advice", "notice"),
    (r"boredom is not", "advice", "boredom"),
    (r"change the landscape", "advice", "landscape"),
    (r"none of this is about shame", "advice", "noshame"),
    (r"next time you catch your thumb", "end", "final"),
    (r"now you know exactly why", "end", "final"),
]
RULES = [(re.compile(p, re.I), k, v) for p, k, v in RULES]

# Key-term tags shown at the top-left of a scene.
TERMS = [
    (r"unbroken line of checkers", "A line of checkers"),
    (r"story gets stranger", "Dopamine"),
    (r"pleasure chemical", "Dopamine ≠ pleasure"),
    (r"wanting and liking", "Wanting ≠ Liking"),
    (r"prediction error", "Prediction error"),
    (r"certainty is boring", "Certainty is boring · Uncertainty is magnetic"),
    (r"variable ratio", "Variable ratio schedule"),
    (r"natural slot machine", "A natural slot machine"),
    (r"apps did not invent", "Apps found your oldest hunger"),
    (r"marginal value theorem", "Marginal value theorem"),
    (r"xerox parc", "Information foraging theory"),
    (r"information, to your brain, is food", "Information = food"),
    (r"a real bush runs out", "A feed never runs out"),
    (r"only half of the story", "Other people"),
    (r"robin dunbar", "Gossip = grooming"),
    (r"people left out", "Social pain ≈ physical pain"),
    (r"evolutionary mismatch", "Evolutionary mismatch"),
    (r"you are not broken", "You are not broken"),
    (r"curiosity and compulsion", "Curiosity = compulsion"),
    (r"how to destroy", "Who is steering it?"),
    (r"ancient brain in a modern pocket", "Ancient brain, modern pocket"),
    (r"start by noticing", "1 · Notice the itch"),
    (r"boredom is not", "Boredom = go and look"),
    (r"change the landscape", "2 · Change the landscape"),
    (r"none of this is about shame", "No shame"),
]
TERMS = [(re.compile(p, re.I), t) for p, t in TERMS]

# Researchers named in the script.
PEOPLE = [
    (r"olds and peter milner", "James Olds & Peter Milner"),
    (r"berridge", "Kent Berridge"),
    (r"schultz", "Wolfram Schultz"),
    (r"skinner", "B. F. Skinner"),
    (r"charnov", "Eric Charnov"),
    (r"pirolli", "Peter Pirolli & Stuart Card"),
    (r"dunbar", "Robin Dunbar"),
    (r"eisenberger", "Naomi Eisenberger"),
]
PEOPLE = [(re.compile(p, re.I), n) for p, n in PEOPLE]

YEAR_RX = re.compile(r"\b(1[89]\d\d|20\d\d)s?\b")
ERA_RX = re.compile(r"two hundred thousand years ago", re.I)


def read_paragraphs():
    text = SCRIPT.read_text(encoding="utf-8")
    return [line.strip() for line in text.splitlines() if line.strip()]


def split_chunks(text, limit=130):
    """Group sentences into caption chunks that fit on two or three lines."""
    sentences = re.split(r"(?<=[.?!])\s+", text)
    chunks, cur = [], ""
    for s in sentences:
        if cur and len(cur) + 1 + len(s) > limit:
            chunks.append(cur)
            cur = s
        else:
            cur = f"{cur} {s}".strip()
    if cur:
        chunks.append(cur)
    return chunks


def build_scenes(paragraphs):
    kind, variant = "phone", "check"
    scenes = []
    for i, text in enumerate(paragraphs):
        for rx, k, v in RULES:
            if rx.search(text):
                kind, variant = k, v
                break
        label = next((t for rx, t in TERMS if rx.search(text)), None)
        person = next((n for rx, n in PEOPLE if rx.search(text)), None)
        if ERA_RX.search(text):
            year = "≈ 200,000 years ago"
        else:
            m = YEAR_RX.search(text)
            year = m.group(0) if m else None
        scenes.append(
            {
                "id": i + 1,
                "text": text,
                "kind": kind,
                "variant": variant,
                "label": label,
                "person": person,
                "year": year,
            }
        )
    return scenes


# ------------------------------ audio -------------------------------------
async def synth_all(texts, paths):
    import edge_tts

    sem = asyncio.Semaphore(4)

    async def one(text, path):
        async with sem:
            for attempt in range(4):
                try:
                    await edge_tts.Communicate(text, VOICE, rate=RATE).save(str(path))
                    return
                except Exception as exc:  # network hiccup, retry
                    if attempt == 3:
                        raise
                    print(f"  retry ({exc})", file=sys.stderr)
                    await asyncio.sleep(2 * (attempt + 1))

    await asyncio.gather(*(one(t, p) for t, p in zip(texts, paths)))


def write_silence(path, seconds):
    n = int(round(seconds * SAMPLE_RATE))
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        w.writeframes(b"\x00\x00" * n)


def to_wav(src, dst):
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error", "-i", str(src),
            "-ar", str(SAMPLE_RATE), "-ac", "1",
            "-af", f"apad=pad_dur={GAP}", str(dst),
        ],
        check=True,
    )


def wav_seconds(path):
    with wave.open(str(path), "rb") as w:
        return w.getnframes() / w.getframerate()


def concat_wavs(paths, dst, tail):
    with wave.open(str(dst), "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(SAMPLE_RATE)
        for p in paths:
            with wave.open(str(p), "rb") as w:
                out.writeframes(w.readframes(w.getnframes()))
        out.writeframes(b"\x00\x00" * int(round(tail * SAMPLE_RATE)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--silent", action="store_true", help="skip TTS, estimate timings")
    args = ap.parse_args()

    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg is required (apt-get install ffmpeg)")

    paragraphs = read_paragraphs()
    scenes = build_scenes(paragraphs)
    print(f"{len(scenes)} scenes from {SCRIPT.name}")

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        wavs = []
        if args.silent:
            for i, text in enumerate(paragraphs):
                words = len(text.split())
                wav = tmp / f"{i:03d}.wav"
                write_silence(wav, words / WORDS_PER_SEC + GAP)
                wavs.append(wav)
        else:
            mp3s = [tmp / f"{i:03d}.mp3" for i in range(len(paragraphs))]
            print(f"Synthesizing with {VOICE} ({RATE}) ...")
            asyncio.run(synth_all(paragraphs, mp3s))
            for i, mp3 in enumerate(mp3s):
                wav = tmp / f"{i:03d}.wav"
                to_wav(mp3, wav)
                wavs.append(wav)

        durations = [wav_seconds(w) for w in wavs]
        full = tmp / "voice.wav"
        concat_wavs(wavs, full, TAIL)
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error", "-i", str(full),
                "-codec:a", "libmp3lame", "-b:a", "128k", str(VOICE_OUT),
            ],
            check=True,
        )

    # Timings in frames (rounded on cumulative time so nothing drifts).
    t = 0.0
    start_f = 0
    for i, (sc, dur) in enumerate(zip(scenes, durations)):
        t += dur
        end_f = round(t * FPS)
        if i == len(scenes) - 1:
            end_f = round((t + TAIL) * FPS)
        sc["start"] = start_f
        sc["frames"] = end_f - start_f
        start_f = end_f

        chunks = split_chunks(sc["text"])
        weights = [len(c) + 8 for c in chunks]
        total_w = sum(weights)
        acc, items = 0, []
        for c, w in zip(chunks, weights):
            a = round(sc["frames"] * acc / total_w)
            acc += w
            b = round(sc["frames"] * acc / total_w)
            items.append({"text": c, "from": a, "frames": max(1, b - a)})
        sc["chunks"] = items

    data = {
        "fps": FPS,
        "width": WIDTH,
        "height": HEIGHT,
        "voice": "silent" if args.silent else VOICE,
        "totalFrames": start_f,
        "scenes": scenes,
    }
    DATA_OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"data.json: {start_f} frames ({start_f / FPS:.1f}s), voice.mp3 written")


if __name__ == "__main__":
    main()
