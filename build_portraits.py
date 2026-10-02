#!/usr/bin/env python3
"""Build social-ready 9:16 editions and add them to lessons.json."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
MANIFEST = ROOT / "lessons.json"
FONT = Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf")
LABELS = {
    "en": ("LESSON", "9:16 SOCIAL EDITION"),
    "ru": ("УРОК", "9:16 ВЕРТИКАЛЬНЫЙ ФОРМАТ"),
    "uz": ("DARS", "9:16 VERTIKAL FORMAT"),
}


def run(*args: str) -> None:
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def probe(path: Path) -> dict:
    result = subprocess.run(
        [
            "ffprobe", "-v", "error", "-select_streams", "v:0",
            "-show_entries", "stream=width,height:format=duration,size",
            "-of", "json", str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def background(path: Path, lesson: int, lang: str) -> None:
    image = Image.new("RGB", (1080, 1920), "#0A0A0F")
    draw = ImageDraw.Draw(image)
    bold = lambda size: ImageFont.truetype(str(FONT), size)
    lesson_word, edition = LABELS[lang]

    draw.rectangle((0, 0, 17, 1919), fill="#FF6B35")
    draw.text((70, 330), "KAMOD", font=bold(76), fill="#FF6B35")
    draw.text((350, 350), "TUTORIALS", font=bold(52), fill="#FFFFFF")
    draw.text((70, 455), f"{lesson_word} {lesson:02d} · {lang.upper()}", font=bold(30), fill="#9B9BA3")
    draw.rounded_rectangle((36, 675, 1044, 1245), radius=22, fill="#101017", outline="#7A3A25", width=3)
    draw.text((70, 1380), edition, font=bold(42), fill="#FFFFFF")
    draw.text((70, 1460), "kamod.io/tutorials", font=bold(34), fill="#FF6B35")
    image.save(path, optimize=True)


def build_one(lesson: int, lang: str, force: bool) -> tuple[int, str, dict]:
    folder = ROOT / lang
    source = folder / f"lesson-{lesson:02d}.mp4"
    target = folder / f"lesson-{lesson:02d}-9x16.mp4"
    poster = folder / f"lesson-{lesson:02d}-9x16.jpg"
    if not source.exists():
        raise FileNotFoundError(source)

    if force or not target.exists() or not poster.exists():
        with tempfile.TemporaryDirectory(prefix="kamod-portrait-") as td:
            bg = Path(td) / "background.png"
            background(bg, lesson, lang)
            run(
                "ffmpeg", "-y", "-loop", "1", "-i", str(bg), "-i", str(source),
                "-filter_complex", "[1:v]scale=1000:562:flags=lanczos[lesson];[0:v][lesson]overlay=40:679:shortest=1[v]",
                "-map", "[v]", "-map", "1:a?", "-c:v", "libx264", "-preset", "veryfast", "-crf", "22",
                "-pix_fmt", "yuv420p", "-c:a", "copy", "-shortest", "-movflags", "+faststart", str(target),
            )
            run("ffmpeg", "-y", "-ss", "1", "-i", str(target), "-frames:v", "1", "-q:v", "2", str(poster))

    source_info = probe(source)
    target_info = probe(target)
    stream = target_info["streams"][0]
    if (stream["width"], stream["height"]) != (1080, 1920):
        raise RuntimeError(f"Wrong dimensions for {target}: {stream}")
    if abs(float(source_info["format"]["duration"]) - float(target_info["format"]["duration"])) > 0.25:
        raise RuntimeError(f"Duration changed for {target}")

    return lesson, lang, {
        "video": f"{lang}/{target.name}",
        "poster": f"{lang}/{poster.name}",
        "bytes": target.stat().st_size,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--jobs", type=int, default=min(4, os.cpu_count() or 1))
    args = parser.parse_args()

    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    tasks = [(lesson["n"], lang) for lesson in data["lessons"] for lang in LABELS]
    built: dict[tuple[int, str], dict] = {}
    with ThreadPoolExecutor(max_workers=max(1, args.jobs)) as pool:
        futures = {pool.submit(build_one, n, lang, args.force): (n, lang) for n, lang in tasks}
        for future in as_completed(futures):
            n, lang, media = future.result()
            built[(n, lang)] = media
            print(f"built {lang}/lesson-{n:02d}-9x16.mp4")

    for lesson in data["lessons"]:
        for lang, localized in lesson["langs"].items():
            localized["formats"] = {
                "16x9": {
                    "video": localized["video"],
                    "poster": localized["poster"],
                    "bytes": localized["bytes"],
                },
                "9x16": built[(lesson["n"], lang)],
            }
    MANIFEST.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"updated {MANIFEST} with {len(tasks)} portrait editions")


if __name__ == "__main__":
    main()
