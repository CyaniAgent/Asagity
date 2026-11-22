# 音频资源转换规范（Audio Assets Pipeline）

> 状态：**活跃**（2026-11-22）
> 工具：[`scripts/audio_assets.py`](../scripts/audio_assets.py) — Python 3 标准库单文件，转换时唯一外部依赖为 ffmpeg（需含 `libopus`）
> 资源目录：[`web/public/sounds/`](../web/public/sounds/)
> 消费方：[`web/src/stores/soundManager.ts`](../web/src/stores/soundManager.ts)、[`web/src/stores/music.ts`](../web/src/stores/music.ts)

## 1. 背景与格式选型

### 1.1 现状

转换前 `web/public/sounds/` 下有 **36 个 WAV** 提示音 + 1 个音乐测试 MP3，全部为
**44.1kHz / 16-bit / 立体声 PCM**（`System/Elastic/TaskAssigned.wav` 为 48kHz），
音频合计约 **17.7 MB**（其中 `MusicTest.mp3` 约 6.5 MB）。

播放链路不是 `<audio>` 流式播放，而是：

```text
fetch(url) -> ArrayBuffer -> AudioContext.decodeAudioData() -> AudioBuffer
```

这个前提决定了格式选型——浏览器必须能一次性解码整个文件。

### 1.2 Opus vs AAC

| 维度 | WebM / Opus | AAC / M4A |
|---|---|---|
| 同码率音质 | 低码率优势明显；192kbps 对提示音已接近听感无损 | 同码率略逊，短音效尤甚 |
| 编码延迟 | 帧长 2.5–20ms，pre-skip 极短，点按即响 | 1024–2048 样本 encoder delay + priming，短音效起音被抹糊 |
| `decodeAudioData` | Chrome/Edge/Firefox 全支持，Safari 17.4+ 支持 WebM/Opus | 兼容好但无音质/延迟优势 |
| 容器 | WebM 比 Ogg 略大，但 Safari 对 WebM 支持更好 | M4A 头部中等 |

**结论：统一使用 `.webm` (Opus)，固定 `-b:a 192k` 立体声。**
AAC 的唯一优势是旧版 Safari 兼容，2026 年已不成立。真要逐样本无损应选 FLAC，
但对短音效只省 40–60% 且 Safari 解码支持不稳，不符合"近似无损 + 极限压缩"目标。

> 注：ffmpeg 使用 `-b:a 192k -vbr on`，即 **192kbps 目标平均码率**（VBR），
> 不是逐帧严格 CBR。这是 Opus 在文件场景下的推荐模式。

## 2. 资源目录约定

```text
web/public/sounds/
├── AyaxYuna/                  # 角色提示音（ca / ace / tap_* / linear* …）
│   └── meet/                  # 铃声（ringtone_beat / ringring / sea）
├── System/                    # 系统提示音（Error / NoteSent / Warning …）
│   └── Elastic/               # 任务流提示音（TaskStart / TaskEnd …）
└── MusicTest.mp3              # 音乐播放器测试素材（不参与转换）
```

- 转换工具**递归扫描整个目录树**，新增到任意层级的 `.wav` 都会被发现，**无白名单、无路径硬编码**。
- `.mp3` 音乐素材不参与转换（它走 `new Audio()` 流式播放，场景不同）。
- 输出为**同目录、同 basename、`.webm` 扩展名**。

## 3. 工具命令

在项目根目录执行：

| 命令 | 作用 |
|---|---|
| `python scripts/audio_assets.py check` | 校验所有音频文件格式（RIFF/WAVE 头、EBML+OpusHead、MP3 头）与代码引用完整性 |
| `python scripts/audio_assets.py manifest` | 生成/刷新 SHA-256 资源清单 `scripts/audio-assets.manifest.json` |
| `python scripts/audio_assets.py convert` | **预览**转换计划（dry-run，不写文件） |
| `python scripts/audio_assets.py convert --apply` | 执行转换（递归、固定 192kbps 立体声），详见 §4 |
| `python scripts/audio_assets.py verify` | 复核格式、引用、清单哈希差异、迁移残留 |

`convert` 选项：

| 选项 | 默认 | 说明 |
|---|---|---|
| `--apply` | 关闭 | 不加则只预览。**写入操作必须显式确认** |
| `--keep-wav` | 关闭（即默认删 WAV） | 转换成功后保留源 `.wav` |
| `--no-overwrite` | 关闭（即默认覆盖） | 同名 `.webm` 已存在时跳过而不覆盖 |
| `--frame-duration` | `20` | Opus 帧长（ms），可选 2.5 / 5 / 10 / 20 |
| `--root` | 项目根 | 指定项目根目录，可写在子命令前或后 |

> 码率、声道**不可通过 CLI 覆盖**，固定为 `-c:a libopus -b:a 192k`（立体声）。
> 旧的 `--mono` / `--bitrate` / `--mono-bitrate` / `--rewrite-registry` 已移除。

## 4. 转换机制（`convert --apply`）

执行顺序是**严格铁律**，不可调整：

```text
1. 递归扫描 web/public/sounds/ 及所有子目录 -> 收集每一个 .wav
2. 逐个调用 ffmpeg 转为同名 .webm（libopus, 192k, 立体声）
3. 校验输出：EBML 头 + OpusHead + 体积下限；无效则删除坏输出并计入失败
4. 全部成功后，自动把 soundRegistry 中命中的 .wav 路径改为 .webm
5. 重新扫描 web/src 全部源码引用，确认无任何代码仍引用待删 WAV
6. 仅对未被引用者，删除源 .wav（失败文件、被引用文件一律保留）
7. 自动刷新 SHA-256 清单，避免 verify 误报"清单文件丢失"
```

**第 4→5→6 步的顺序是安全核心**：若先删 WAV 再改 registry，或 registry 改写未命中
（例如源码用单引号而替换逻辑只认双引号），应用会指向已删除的文件导致提示音全部失效。
因此第 5 步使用与 `check` 相同的引用解析器（识别 `"..."`、`'...'`、反引号三种写法），
发现残留引用即**拒绝删除该文件并报错退出**。

### 4.1 失败语义

- 单个文件转换失败：计入错误，**保留其 WAV**，不影响其他文件；退出码 1。
- 引用安全校验失败：**不删除**对应 WAV，WebM 仍保留，registry 可能已部分更新；退出码 1。
- 缺少 ffmpeg 或无 `libopus` 编码器：立即退出码 2，不做任何改动。
- `--keep-wav`：仅跳过第 6 步，registry 与清单照常更新。

## 5. 标准作业流程（SOP）

```bash
# 0. 前置：ffmpeg（含 libopus）必须在 PATH 中
ffmpeg -encoders | findstr libopus

# 1. 转换前体检：确认格式与引用现状
python scripts/audio_assets.py check

# 2. 预览转换计划（确认发现数量与路径）
python scripts/audio_assets.py convert

# 3. 执行转换（递归转换 + 删 WAV + 改 registry + 刷清单）
python scripts/audio_assets.py convert --apply

# 4. 复核：格式、引用、清单一致性、迁移残留
python scripts/audio_assets.py verify
```

新增提示音时，只需把 `.wav` 丢进 `web/public/sounds/` 的任意层级，重跑 §5 步骤 2–4 即可。

## 6. 验证记录

实现时用 stub ffmpeg 与临时夹具完成以下验证（2026-11-22）：

| 场景 | 预期 | 结果 |
|---|---|---|
| 真实仓库 dry-run | 递归发现 36 个 WAV，含 `meet/` 与 `Elastic/` 子目录 | ✅ |
| ffmpeg 实际参数 | `-b:a 192k`，且**无** `-ac 1` | ✅ |
| `--apply` 端到端 | WebM 保留、源 WAV 删除、registry 改写 `.webm`、清单刷新 | ✅ |
| 单引号引用（替换逻辑不命中） | 安全校验拦截，**拒绝删除**，exit 1 | ✅ |
| 损坏 WAV / 缺失引用 | 明确报错，exit 1 | ✅ |
| `--keep-wav` | WAV 与 WebM 共存，registry 仍改 `.webm` | ✅ |
| 清单比对 | SHA-256 一致 | ✅ |

## 7. 已知问题与待办

| 项 | 状态 | 说明 |
|---|---|---|
| 本机未安装 ffmpeg | ⚠️ 环境 | 真实音频尚未转换；仓库仍是 36 WAV / 0 WebM。装好后执行 §5 即可 |
| `MusicTest0/1/2.mp3` 坏引用 | ✅ 已修复（2026-11-22） | `music.ts` 中 4 处 URL 统一指向真实文件 `MusicTest.mp3`；3 条播放列表占位条目保留，id/title 不变（demo 数据） |
| 32 个孤立资源 | 📋 待确认 | 多数为 `AyaxYuna/` 下的点击音与铃声，无任何代码引用；`check --show-orphans` 查看全部 |
| 跨浏览器冒烟测试 | 📋 待做 | 项目已有 Playwright，建议补一条验证 `decodeAudioData` 播放 WebM/Opus 的用例 |

## 8. 故障排查

| 现象 | 原因 | 处理 |
|---|---|---|
| `未找到 ffmpeg` | PATH 中没有 ffmpeg | 安装（如 `winget install Gyan.FFmpeg`） |
| `不含 libopus 编码器` | ffmpeg 构建裁剪过 | 换带 libopus 的完整构建 |
| `拒绝删除仍被引用的 WAV` | registry 改写未命中（引号风格/路径不同） | 检查该引用源码，手动对齐为双引号或修正路径后重跑 |
| `verify` 报"清单中记录的文件已丢失" | 直接手删/手改了音频文件 | 重跑 `manifest` 刷新，或执行 `convert --apply` 走完整流程 |
| Windows 控制台中文乱码 | 终端编码非 UTF-8 | 脚本已强制 UTF-8 输出；必要时设 `PYTHONIOENCODING=utf-8` |
