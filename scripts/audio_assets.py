#!/usr/bin/env python3
"""Asagity 音频资源统一工具：格式校验 / 格式转换 / 资源完整性校验。

全部使用 Python 标准库，唯一的外部依赖是转换时需要的 ffmpeg（带 libopus）。

常用命令（在项目根目录执行）::

    python scripts/audio_assets.py check                    # 校验所有声音文件格式 + 引用完整性
    python scripts/audio_assets.py manifest                 # 生成 SHA-256 完整性清单
    python scripts/audio_assets.py convert                   # 预览转换计划（不写文件）
    python scripts/audio_assets.py convert --apply           # 递归转换全部 WAV 为 WebM/Opus（固定 192kbps 立体声）

转换规则（--apply 时固定执行，不可通过参数改码率）:
  - 扫描 web/public/sounds/ 及所有子目录里的每一个 .wav，无白名单
  - 转为同目录同名 .webm，Opus 立体声 192kbps
  - 校验输出有效后，自动改写 soundRegistry 的 .wav 路径为 .webm
  - 确认 registry 不再引用待删 WAV 后，删除源 .wav
  - 自动刷新 SHA-256 清单

退出码: 0 = 通过；1 = 有 ERROR；2 = 环境/用法错误（如缺 ffmpeg）。
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import struct
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_ROOT = SCRIPT_DIR.parent
SOUNDS_REL = Path("web/public/sounds")
SRC_REL = Path("web/src")
REGISTRY_REL = Path("web/src/stores/soundManager.ts")
MANIFEST_REL = Path("scripts/audio-assets.manifest.json")

AUDIO_EXTS = {".wav", ".mp3", ".webm", ".ogg", ".oga", ".m4a", ".aac", ".flac", ".opus"}
SOURCE_EXTS = {".ts", ".tsx", ".js", ".jsx"}
REF_RE = re.compile(r"""["'`](/sounds/[^"'`\s<>]+)["'`]""")
BITRATE = "192k"  # 固定：立体声 192kbps Opus（转换参数不可通过 CLI 覆盖）


# --------------------------------------------------------------------------- #
# 数据模型
# --------------------------------------------------------------------------- #
@dataclass
class FileInfo:
    path: Path
    rel: str
    kind: str
    size: int
    details: dict[str, object] = field(default_factory=dict)
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.errors


@dataclass
class Ref:
    url: str
    source: str
    line: int


# --------------------------------------------------------------------------- #
# 基础工具
# --------------------------------------------------------------------------- #
def ok(msg: str) -> None:
    print(f"[ OK ] {msg}")


def warn(msg: str) -> None:
    print(f"[WARN ] {msg}")


def fail(msg: str) -> None:
    print(f"[FAIL ] {msg}")


def note(msg: str) -> None:
    print(f"       {msg}")


def human_size(n: int) -> str:
    return f"{n / 1024:.1f}KB" if n < 1024 * 1024 else f"{n / 1024 / 1024:.2f}MB"


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


# --------------------------------------------------------------------------- #
# 文件头探测
# --------------------------------------------------------------------------- #
def probe_wav(path: Path) -> FileInfo:
    info = FileInfo(path=path, rel="", kind="wav", size=path.stat().st_size)
    data = path.read_bytes()
    info.rel = path.name

    if len(data) < 12 or data[:4] != b"RIFF" or data[8:12] != b"WAVE":
        info.errors.append("不是有效的 RIFF/WAVE 文件")
        return info

    pos = 12
    fmt: tuple[int, int, int, int, int] | None = None  # format, channels, rate, byte_rate, bits
    data_size: int | None = None
    while pos + 8 <= len(data):
        chunk_id = data[pos : pos + 4]
        chunk_size = struct.unpack_from("<I", data, pos + 4)[0]
        body = pos + 8
        if chunk_id == b"fmt " and chunk_size >= 16:
            audio_format, channels, rate = struct.unpack_from("<HHI", data, body)
            byte_rate = struct.unpack_from("<I", data, body + 8)[0]
            bits = struct.unpack_from("<H", data, body + 14)[0]
            fmt = (audio_format, channels, rate, byte_rate, bits)
        elif chunk_id == b"data":
            data_size = chunk_size
            break
        pos = body + chunk_size + (chunk_size & 1)

    if fmt is None:
        info.errors.append("缺少 fmt 块")
        return info
    audio_format, channels, rate, byte_rate, bits = fmt

    if audio_format != 1:
        info.errors.append(f"非 PCM 编码 (audio_format={audio_format})")
    if data_size is None:
        info.errors.append("缺少 data 块")
    elif data_size <= 0:
        info.errors.append("data 块为空")
    elif body + chunk_size > len(data) + 1:
        info.errors.append("data 块被截断")

    duration = (data_size / byte_rate) if (data_size and byte_rate) else 0.0
    info.details = {
        "rate": rate,
        "bits": bits,
        "channels": channels,
        "duration": duration,
        "codec": "PCM" if audio_format == 1 else str(audio_format),
    }
    if rate not in (44100, 48000):
        info.warnings.append(f"非常规采样率 {rate}Hz")
    if bits != 16:
        info.warnings.append(f"非常规位深 {bits}bit")
    if channels not in (1, 2):
        info.warnings.append(f"非常规声道数 {channels}")
    return info


def probe_webm(path: Path) -> FileInfo:
    info = FileInfo(path=path, rel="", kind="webm", size=path.stat().st_size)
    head = path.read_bytes()[:8192]
    info.rel = path.name
    if not head.startswith(b"\x1a\x45\xdf\xa3"):
        info.errors.append("缺少 EBML 头，不是 WebM")
    if b"OpusHead" not in head:
        info.errors.append("缺少 OpusHead，不是 Opus 音轨")
    # 不检查 OpusTags：ffmpeg 配 -map_metadata -1 时会省略 tags 页，
    # 真实有效的 WebM/Opus 也可能不含该字面量，检查它会产生大量误报。
    if info.size < 100:
        info.errors.append("文件过小，疑似空文件或截断")
    info.details = {"codec": "Opus", "duration": None}
    return info


def probe_mp3(path: Path) -> FileInfo:
    info = FileInfo(path=path, rel="", kind="mp3", size=path.stat().st_size)
    head = path.read_bytes()[:8192]
    info.rel = path.name
    if head[:3] != b"ID3" and not (len(head) >= 2 and head[0] == 0xFF and (head[1] & 0xE0) == 0xE0):
        info.errors.append("既无 ID3 头也无 MPEG 帧同步，不是 MP3")
    if info.size < 100:
        info.errors.append("文件过小，疑似空文件或截断")
    info.details = {"codec": "MP3", "duration": None}
    return info


def probe_file(path: Path, root: Path) -> FileInfo:
    suffix = path.suffix.lower()
    if suffix == ".wav":
        info = probe_wav(path)
    elif suffix in (".webm", ".opus"):
        info = probe_webm(path)
    elif suffix == ".mp3":
        info = probe_mp3(path)
    else:
        info = FileInfo(path=path, rel="", kind=suffix.lstrip("."), size=path.stat().st_size)
        info.warnings.append("未知格式，仅记录大小")
    info.rel = path.relative_to(root).as_posix()
    return info


# --------------------------------------------------------------------------- #
# 扫描与引用解析
# --------------------------------------------------------------------------- #
def collect_files(root: Path) -> list[Path]:
    base = root / SOUNDS_REL
    if not base.is_dir():
        return []
    return sorted(p for p in base.rglob("*") if p.is_file() and p.suffix.lower() in AUDIO_EXTS)


def collect_refs(root: Path) -> list[Ref]:
    refs: list[Ref] = []
    src_dir = root / SRC_REL
    if not src_dir.is_dir():
        return refs
    for source in sorted(p for p in src_dir.rglob("*") if p.is_file() and p.suffix.lower() in SOURCE_EXTS):
        text = source.read_bytes().decode("utf-8", errors="replace")
        for lineno, line in enumerate(text.splitlines(), start=1):
            for match in REF_RE.finditer(line):
                refs.append(Ref(url=match.group(1), source=source.relative_to(root).as_posix(), line=lineno))
    return refs


def ref_to_path(root: Path, url: str) -> Path:
    return root / SOUNDS_REL / Path(url[len("/sounds/") :])


def check_integrity(root: Path, files: Iterable[Path], refs: Iterable[Ref]) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    existing = {p.relative_to(root / SOUNDS_REL).as_posix(): p for p in files}

    grouped: dict[str, list[Ref]] = {}
    for ref in refs:
        grouped.setdefault(ref.url, []).append(ref)

    for url, places in sorted(grouped.items()):
        key = url[len("/sounds/") :]
        if key not in existing:
            where = ", ".join(f"{r.source}:{r.line}" for r in places[:3])
            errors.append(f"引用了不存在的文件: {url}  ({where})")
        elif len(places) > 1:
            warnings.append(f"同一资源被引用 {len(places)} 次: {url}")

    referenced = {r.url[len("/sounds/") :] for r in refs}
    for key in sorted(set(existing) - referenced):
        warnings.append(f"未被任何代码引用的孤立资源: /sounds/{key}")

    return errors, warnings


# --------------------------------------------------------------------------- #
# 清单
# --------------------------------------------------------------------------- #
def build_manifest(root: Path, files: Iterable[Path]) -> dict:
    entries = {}
    for path in files:
        entries[path.relative_to(root / SOUNDS_REL).as_posix()] = {
            "sha256": sha256_of(path),
            "bytes": path.stat().st_size,
        }
    return {"schema": 1, "files": dict(sorted(entries.items()))}


def load_manifest(root: Path) -> dict | None:
    path = root / MANIFEST_REL
    if not path.is_file():
        return None
    try:
        data = json.loads(path.read_bytes().decode("utf-8"))
        if data.get("schema") != 1 or not isinstance(data.get("files"), dict):
            raise ValueError("schema 不匹配")
        return data
    except (ValueError, OSError) as exc:
        warn(f"清单读取失败，忽略: {path} ({exc})")
        return None


# --------------------------------------------------------------------------- #
# 子命令：check
# --------------------------------------------------------------------------- #
def report_integrity(
    errors: list[str], warnings: list[str], show_all_orphans: bool
) -> None:
    """打印完整性结果；孤立资源默认只列前 5 条，避免刷屏。"""
    orphans = [w for w in warnings if "孤立资源" in w]
    rest = [w for w in warnings if "孤立资源" not in w]
    for msg in rest:
        warn(msg)
    if orphans:
        limit = len(orphans) if show_all_orphans else 5
        for msg in orphans[:limit]:
            warn(msg)
        if len(orphans) > limit:
            note(f"... 还有 {len(orphans) - limit} 个孤立资源（加 --show-orphans 查看全部）")
    for msg in errors:
        fail(msg)
    if not errors and not warnings:
        ok("所有引用均可解析，没有孤立资源")


def cmd_check(args: argparse.Namespace, root: Path) -> int:
    files = collect_files(root)
    refs = collect_refs(root)
    infos = [probe_file(p, root) for p in files]

    print("=" * 88)
    print(f"格式校验 — {len(infos)} 个音频文件, {len(refs)} 处代码引用")
    print("=" * 88)
    for info in infos:
        if info.kind == "wav":
            d = info.details
            if not d:
                desc = "WAVE (无法解析文件头)"
            else:
                desc = (
                    f"WAVE {d.get('codec', '?')} {d.get('rate', '?')}Hz/"
                    f"{d.get('bits', '?')}bit/{d.get('channels', '?')}ch "
                    f"{float(d.get('duration') or 0):.1f}s"
                )
        else:
            desc = f"{info.kind.upper()} ({info.details.get('codec', '?')})"
        print(f"{'[ OK ]' if info.ok else '[FAIL ]'} {info.rel:<48} {human_size(info.size):>9}  {desc}")
        for msg in info.warnings:
            note(f"WARN: {msg}")
        for msg in info.errors:
            fail(f"{info.rel}: {msg}")

    print("-" * 88)
    integrity_errors, integrity_warnings = check_integrity(root, files, refs)
    print("资源完整性:")
    report_integrity(integrity_errors, integrity_warnings, args.show_orphans)

    n_errors = sum(len(i.errors) for i in infos) + len(integrity_errors)
    n_warns = sum(len(i.warnings) for i in infos) + len(integrity_warnings)
    print("-" * 88)
    print(f"结果: {n_errors} ERROR, {n_warns} WARN")
    return 1 if n_errors else 0


# --------------------------------------------------------------------------- #
# 子命令：manifest
# --------------------------------------------------------------------------- #
def cmd_manifest(args: argparse.Namespace, root: Path) -> int:
    files = collect_files(root)
    if not files:
        fail("没有找到音频文件")
        return 1
    manifest = build_manifest(root, files)
    out = root / MANIFEST_REL
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True).encode("utf-8") + b"\n")
    total = sum(item["bytes"] for item in manifest["files"].values())
    ok(f"已生成 {out.relative_to(root)} — {len(manifest['files'])} 个文件, 合计 {human_size(total)}")
    return 0


# --------------------------------------------------------------------------- #
# 子命令：convert
# --------------------------------------------------------------------------- #
def ffmpeg_bin() -> str | None:
    return shutil.which("ffmpeg")


def has_libopus(ffmpeg: str) -> bool:
    try:
        out = subprocess.run(
            [ffmpeg, "-hide_banner", "-encoders"], capture_output=True, text=True, timeout=30
        ).stdout
        return "libopus" in out
    except (OSError, subprocess.SubprocessError):
        return False


def convert_one(ffmpeg: str, src: Path, dst: Path, args: argparse.Namespace) -> tuple[bool, str]:
    cmd = [
        ffmpeg, "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
        "-i", str(src),
        "-map_metadata", "-1",
        "-c:a", "libopus",
        "-b:a", BITRATE,
        "-vbr", "on",
        "-compression_level", "10",
        "-frame_duration", args.frame_duration,
        str(dst),
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    except (OSError, subprocess.SubprocessError) as exc:
        return False, f"ffmpeg 执行失败: {exc}"
    if result.returncode != 0:
        return False, f"ffmpeg 退出码 {result.returncode}: {result.stderr.strip()[:300]}"
    if not dst.is_file() or dst.stat().st_size < 100:
        return False, "输出文件不存在或过小"
    info = probe_webm(dst)
    if not info.ok:
        dst.unlink(missing_ok=True)
        return False, "输出不是有效的 WebM/Opus: " + "; ".join(info.errors)
    return True, ""


def rewrite_registry(root: Path, pairs: list[tuple[Path, Path]]) -> None:
    """把 soundRegistry 中命中的 .wav 路径改为 .webm。不做删除，仅改文本。"""
    registry = root / REGISTRY_REL
    if not registry.is_file():
        note(f"registry 不存在，跳过路径改写: {REGISTRY_REL}")
        return
    text = registry.read_bytes().decode("utf-8")
    changed = 0
    for src, dst in pairs:
        old = "/sounds/" + src.relative_to(root / SOUNDS_REL).as_posix()
        new = "/sounds/" + dst.relative_to(root / SOUNDS_REL).as_posix()
        if f'"{old}"' in text:
            text = text.replace(f'"{old}"', f'"{new}"')
            changed += 1
    if changed:
        registry.write_bytes(text.encode("utf-8"))
        ok(f"已更新 {registry.relative_to(root)} 中 {changed} 条路径")
    else:
        note("registry 中没有命中任何待替换路径（资源可能全部为孤立文件）")


def cmd_convert(args: argparse.Namespace, root: Path) -> int:
    ffmpeg: str | None = None
    if args.apply:
        ffmpeg = ffmpeg_bin()
        if ffmpeg is None:
            fail("未找到 ffmpeg。请先安装（带 libopus 的构建），例如: winget install Gyan.FFmpeg")
            return 2
        if not has_libopus(ffmpeg):
            fail("当前 ffmpeg 构建不含 libopus 编码器")
            return 2
    else:
        note("DRY RUN — 仅预览计划，不写入任何文件；加 --apply 才会真正转换")

    # 递归扫描 sounds 目录及所有子目录；无白名单、无路径硬编码。
    wavs = sorted(p for p in collect_files(root) if p.suffix.lower() == ".wav")
    if not wavs:
        warn("没有找到 WAV 文件")
        return 0

    print("=" * 88)
    print(f"转换计划 — 递归发现 {len(wavs)} 个 WAV → WebM/Opus  (固定 {BITRATE} 立体声)")
    print("=" * 88)

    pairs: list[tuple[Path, Path]] = []
    for src in wavs:
        dst = src.with_suffix(".webm")
        if dst.exists() and not args.overwrite:
            warn(f"跳过（目标已存在）: {dst.relative_to(root)}  加 --overwrite 可覆盖")
            continue
        pairs.append((src, dst))
        if not args.apply:
            note(f"{src.relative_to(root)}  ->  {dst.relative_to(root)}")

    if not args.apply:
        note(f"共 {len(pairs)} 个待转换。dry-run 不要求安装 ffmpeg。")
        return 0

    ok(f"待转换 {len(pairs)} 个文件")
    done: list[tuple[Path, Path]] = []
    errors: list[str] = []
    saved = 0
    for idx, (src, dst) in enumerate(pairs, start=1):
        success, msg = convert_one(ffmpeg, src, dst, args)
        label = src.relative_to(root).as_posix()
        if success:
            saved += src.stat().st_size - dst.stat().st_size
            done.append((src, dst))
            print(
                f"[{idx:>3}/{len(pairs)}] [ OK ] {label:<48} "
                f"{human_size(src.stat().st_size):>9} -> {human_size(dst.stat().st_size):>9}"
            )
        else:
            errors.append(f"{label}: {msg}")
            fail(f"[{idx}/{len(pairs)}] {label}: {msg}")

    if done:
        # 顺序铁律：先改 registry，再校验无残留引用，最后才删源 WAV。
        rewrite_registry(root, done)

        if args.remove_wav:
            pending = {src.resolve(): src for src, _ in done}
            blocked: dict[Path, list[Ref]] = {}
            for ref in collect_refs(root):
                if ref.url.endswith(".wav"):
                    target = ref_to_path(root, ref.url).resolve()
                    if target in pending:
                        blocked.setdefault(pending[target], []).append(ref)
            for src, refs in blocked.items():
                where = ", ".join(f"{r.source}:{r.line}" for r in refs[:2])
                errors.append(f"拒绝删除仍被引用的 WAV: {src.relative_to(root)} ({where})")
                fail(errors[-1])

            deleted = 0
            for src, _ in done:
                if src in blocked:
                    continue
                try:
                    src.unlink()
                    deleted += 1
                except OSError as exc:
                    errors.append(f"删除失败 {src.relative_to(root)}: {exc}")
                    fail(errors[-1])
            note(f"已删除 {deleted} 个源 WAV")
        else:
            note("已保留源 WAV（--keep-wav）")

    # 文件集合发生变化，自动刷新清单，避免 verify 误报"清单文件丢失"。
    cmd_manifest(argparse.Namespace(), root)

    print("-" * 88)
    ok(f"成功 {len(done)} 个, 失败 {len(errors)} 个, 节省约 {human_size(max(saved, 0))}")
    return 1 if errors else 0


# --------------------------------------------------------------------------- #
# 子命令：verify
# --------------------------------------------------------------------------- #
def cmd_verify(args: argparse.Namespace, root: Path) -> int:
    files = collect_files(root)
    refs = collect_refs(root)
    infos = [probe_file(p, root) for p in files]
    integrity_errors, integrity_warnings = check_integrity(root, files, refs)

    print("=" * 88)
    print(f"完整性复核 — {len(infos)} 个音频文件, {len(refs)} 处代码引用")
    print("=" * 88)

    errors: list[str] = []
    warnings: list[str] = []

    for info in infos:
        errors.extend(f"{info.rel}: {m}" for m in info.errors)
        warnings.extend(f"{info.rel}: {m}" for m in info.warnings)
    errors.extend(integrity_errors)
    warnings.extend(integrity_warnings)

    manifest = load_manifest(root)
    if manifest is None:
        warn("没有清单，跳过 SHA-256 比对（可先运行 `manifest`）")
    else:
        current = {
            p.relative_to(root / SOUNDS_REL).as_posix(): p for p in files
        }
        recorded = manifest["files"]
        missing = sorted(set(recorded) - set(current))
        added = sorted(set(current) - set(recorded))
        modified: list[str] = []
        for key in sorted(set(recorded) & set(current)):
            entry = recorded[key]
            if sha256_of(current[key]) != entry["sha256"] or current[key].stat().st_size != entry["bytes"]:
                modified.append(key)
        for key in missing:
            errors.append(f"清单中记录的文件已丢失: /sounds/{key}")
        for key in added:
            warnings.append(f"清单中未记录的新文件: /sounds/{key}")
        for key in modified:
            errors.append(f"内容已变更（哈希或大小不符）: /sounds/{key}")
        if not (missing or added or modified):
            ok(f"SHA-256 清单一致（{len(recorded)} 个文件）")
        else:
            note(f"清单差异: 缺失 {len(missing)}, 新增 {len(added)}, 变更 {len(modified)}")

    webms = {p for p in files if p.suffix.lower() == ".webm"}
    stale = [
        ref for ref in refs if ref.url.endswith(".wav") and ref_to_path(root, ref.url).with_suffix(".webm") in webms
    ]
    for ref in stale:
        warnings.append(f"仍引用 WAV，但同名 WebM 已存在: {ref.url} ({ref.source}:{ref.line})")

    print("-" * 88)
    print("复核明细:")
    report_integrity(errors, warnings, args.show_orphans)
    print("-" * 88)
    print(f"结果: {len(errors)} ERROR, {len(warnings)} WARN")
    return 1 if errors else 0


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #
def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Asagity 声音资源：格式校验 / WAV→WebM(Opus) 转换 / 完整性校验",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--root", type=Path, default=DEFAULT_ROOT, help=f"项目根目录（默认 {DEFAULT_ROOT}）")
    sub = parser.add_subparsers(dest="command", required=True)

    chk = sub.add_parser("check", help="校验所有声音文件格式与代码引用完整性")
    chk.add_argument("--show-orphans", action="store_true", help="列出全部孤立资源（默认只列前 5 条）")
    sub.add_parser("manifest", help="生成/刷新 SHA-256 资源清单")

    conv = sub.add_parser("convert", help="递归转换 WAV → WebM/Opus（固定 192kbps 立体声，默认 dry-run）")
    conv.add_argument("--apply", action="store_true", help="真正执行转换（默认只预览）")
    conv.add_argument("--frame-duration", "--frame_duration", dest="frame_duration", default="20", help="Opus 帧长 ms: 2.5/5/10/20（默认 20）")
    conv.add_argument("--no-overwrite", dest="overwrite", action="store_false", default=True, help="不覆盖已存在的 .webm（默认覆盖）")
    conv.add_argument("--keep-wav", dest="remove_wav", action="store_false", default=True, help="保留源 WAV（默认在校验成功后删除）")

    ver = sub.add_parser("verify", help="复核格式、引用、清单一致性与迁移残留")
    ver.add_argument("--show-orphans", action="store_true", help="列出全部孤立资源（默认只列前 5 条）")

    # --root 同时允许写在子命令前/后；SUPPRESS 保证子命令未指定时不覆盖顶层值。
    for subparser in sub.choices.values():
        subparser.add_argument(
            "--root", type=Path, default=argparse.SUPPRESS,
            help="项目根目录（也可写在子命令前）",
        )
    return parser


def main(argv: list[str] | None = None) -> int:
    # Windows 控制台默认 GBK 会把中文输出打成乱码，强制 UTF-8。
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, OSError):
            pass
    args = build_parser().parse_args(argv)
    root = args.root.resolve()
    if not (root / SOUNDS_REL).is_dir():
        fail(f"找不到声音目录: {root / SOUNDS_REL}")
        return 2
    handlers = {
        "check": cmd_check,
        "manifest": cmd_manifest,
        "convert": cmd_convert,
        "verify": cmd_verify,
    }
    return handlers[args.command](args, root)


if __name__ == "__main__":
    sys.exit(main())
