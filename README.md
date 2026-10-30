<div align="center">
  <img src="resources/icon.png" width="88" alt="Reader 图标" />
  <h1>Reader</h1>
  <p><strong>Word 风格的本地 TXT 阅读器</strong></p>
  <p>熟悉的文档界面 · 连续排版 · 两行重叠翻读 · 自定义目录与字体</p>
  <p>
    <a href="https://github.com/SuperSaiyanJcy/reader/releases"><img alt="版本" src="https://img.shields.io/badge/version-1.1.2-2b579a" /></a>
    <a href="https://github.com/SuperSaiyanJcy/reader/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/SuperSaiyanJcy/reader/actions/workflows/ci.yml/badge.svg" /></a>
    <img alt="平台" src="https://img.shields.io/badge/platform-macOS%20ARM64%20%7C%20Windows%20x64-555" />
    <a href="LICENSE"><img alt="许可证" src="https://img.shields.io/badge/license-MIT-green" /></a>
  </p>
  <p>
    <a href="https://github.com/SuperSaiyanJcy/reader/releases/latest">下载安装</a> ·
    <a href="#快速开始">使用说明</a> ·
    <a href="#开发与构建">开发构建</a> ·
    <a href="https://github.com/SuperSaiyanJcy/reader/issues">反馈问题</a>
  </p>
</div>

![Reader 实际界面](docs/images/reader-preview.png)

Reader 将本地 TXT 小说放进熟悉的文档窗口：左上角打开文件，在“开始”调整字体与段落，左侧“导航”查看章节。正文采用连续纸张排版，新章节、新卷直接衔接前文；方向键每次翻动一屏，并保留两行原文帮助衔接。

无需账号或服务器。小说、字体和阅读进度保存在本机，原始 TXT 文件只读。

> Reader 是独立阅读器，与 Microsoft 无隶属关系。“Word”仅描述参考的界面样式；本项目不包含 Microsoft Word，也不编辑 DOC / DOCX 文档。

## 目录

- [功能一览](#功能一览)
- [下载与安装](#下载与安装)
- [快速开始](#快速开始)
- [字体与排版](#字体与排版)
- [章节目录与正则](#章节目录与正则)
- [快捷键](#快捷键)
- [工作文档切换](#工作文档切换)
- [编码与本地数据](#编码与本地数据)
- [常见问题](#常见问题)
- [开发与构建](#开发与构建)
- [项目结构](#项目结构)
- [限制与验证](#限制与验证)
- [贡献与许可证](#贡献与许可证)

## 功能一览

| 功能 | 说明 |
| --- | --- |
| 文档风格界面 | 标题栏、功能区、水平标尺、白色正文、导航窗格和底部状态栏 |
| 本地 TXT 阅读 | 系统文件选择器打开文件，多编码解码，原文件只读 |
| 连续纸张排版 | 取消固定页高和内部页间补白，新章、新卷不强制另起一页 |
| 两行重叠翻读 | ← / ↑ 向前，→ / ↓ 向后；按当前字体、行距和缩放保留两行原文 |
| 字体与段落 | 字体、字号、粗体、斜体、下划线、文字颜色、对齐、行距与首行缩进 |
| TTF 字体导入 | 导入后立即应用、按内容去重、重启恢复，可移除应用内副本 |
| 章节导航 | 左侧“导航”按钮一键开关，预设规则识别中文、英文和数字标题 |
| 自定义正则 | 标题匹配预览、捕获组命名、无效规则提示及工作线程超时保护 |
| 全文查找 | 搜索结果列表、正文高亮与结果定位 |
| 最近阅读与续读 | 最近 20 个文档，保存阅读位置、目录规则和界面偏好 |
| 工作文档切换 | Esc 显示工作汇报，快捷键恢复小说；可选失焦自动切换 |
| 双平台打包 | Apple Silicon macOS 和 Windows x64，共用一套代码 |

## 下载与安装

进入 [Releases](https://github.com/SuperSaiyanJcy/reader/releases/latest) 下载对应平台的文件。无需安装 Node.js、npm 或开发工具。

| 平台 | 要求 | 安装包 |
| --- | --- | --- |
| Apple Silicon Mac | macOS 13 及以上，M 系列芯片 | `Reader-版本号-mac-arm64.dmg` 或 `.zip` |
| Windows | Windows 10 / 11，x64 | 安装器 `.exe` 或 `Reader-版本号-win-x64.zip` |

### macOS

1. 下载并打开 DMG。
2. 将 **Reader.app** 拖入“应用程序”。
3. 从“应用程序”打开 Reader。

当前 Mac 包采用本地 **ad-hoc 签名**，没有 Apple Developer ID 公证。如果首次打开被系统阻止，可在“系统设置 → 隐私与安全性”中确认允许打开。

### Windows

- 使用安装器：运行 EXE，按提示选择安装目录。
- 使用免安装版：将 ZIP **完整解压到同一个文件夹**，运行其中的 `Reader.exe`。

免安装版需要同目录的 `resources/` 和 DLL，请勿只复制一个 EXE。当前 Windows 包未使用商业发行证书签名。

## 快速开始

1. **打开小说**：点击左上角 **文件 → 打开 → 浏览**，选择 `.txt` 文件；也可按 `Ctrl / Command + O`。
2. **调整显示**：在 **开始** 中选择字体、字号、行距与对齐方式，设置立即作用于正文。
3. **查看目录**：点击左侧窄工具栏的 **导航**，再次点击即可收起；**视图 → 导航窗格**也可切换。
4. **翻读正文**：点击正文后，使用方向键、空格或 PageUp / PageDown 翻读；滚轮可连续滚动。
5. **继续阅读**：正常退出并重新打开 Reader，会恢复上次文档和阅读位置。

没有自己的文件时，可在 **文件 → 打开示例文档** 中体验内置原创短篇。

窗口标题固定为“文档1 - Word”。自动保存、保存、撤销、共享、批注，以及未实现的功能区图标用于还原外观，点击不执行编辑操作。系统窗口拖动、最小化、缩放与关闭正常工作。

## 字体与排版

### 正文显示

“开始”功能区提供：

- 字体和字号（8–36 pt）。
- 加粗、倾斜、下划线和文字颜色。
- 左对齐、居中、右对齐、两端对齐。
- 1.2、1.5、1.8、2、2.5 倍行距和首行缩进。

右下角可将显示比例调整到 **50%–160%**。字体、缩放与其他偏好会在本机保存。内置字体名称在不同系统上使用相应的可用字体回退，实际字形可能不同。

### 导入 TTF 字体

1. 打开 **开始 → 字体下拉框 → 导入字体…**。
2. 选择本地 `.ttf` 文件。
3. 导入成功后自动应用，字体出现在“自定义字体”分组中。

也可在 **文件 → 自定义字体** 中导入、选择和移除字体。

导入的字体复制到应用数据目录，不需要安装到操作系统；移动原字体文件不影响使用。相同内容只保留一份，重启后自动加载。移除只删除阅读器内的副本，不删除原文件。

## 章节目录与正则

### 自动识别

导航目录根据 TXT 的标题行生成。建议标题单独占一行，例如：

```text
序章
第一章 雨后的书店
第 12 回 沿河而上
卷三 山海
Chapter 1 A New Beginning
PART IV Home
1、归途
尾声
```

可选 **自动识别、中文章节、英文章节、数字标题、自定义正则**。自动模式优先识别明确的章节标题，避免把正文里的普通数字列表混入目录；没有识别到标题时，按约 6000 个字符在段落边界生成分节目录。

点击目录标题可跳转。导航还提供“页面”和“结果”标签，用于预览参考分块或定位搜索结果。

### 自定义规则

打开导航底部的 **目录选项**，选择“自定义正则表达式”，输入规则并检查预览，确认后点击“应用”。

| 目标 | 示例表达式 |
| --- | --- |
| 中文章回节 | `^第[零一二三四五六七八九十百千万0-9]+[章回节].*$` |
| 方括号式标题 | `^【(?<title>.+)】$` |
| 英文 Chapter | `(?i)^chapter\s+[0-9]+.*$` |
| 纯数字标题 | `^\d+$` |

规则使用 **JavaScript 正则语法**，对去掉首尾空白的每一行独立匹配。可直接输入表达式，也支持 `/表达式/imu`；开头的 `(?i)`、`(?m)`、`(?im)` 会转为对应标志。不需要 `g` 标志，不支持跨行标题。

使用 `(?<title>...)` 命名捕获组，或第一个普通捕获组，可指定目录显示文字。预览显示匹配数量和前 40 个标题；无效或无匹配的自定义规则不能应用。

自定义表达式在独立 Web Worker 中执行，约 **2.5 秒**超时后终止，避免复杂表达式卡住界面。

## 快捷键

| 操作 | macOS | Windows |
| --- | --- | --- |
| 打开 TXT | `Command + O` | `Ctrl + O` |
| 查找正文 | `Command + F` | `Ctrl + F` |
| 下一屏，保留原末尾两行 | `→` / `↓` / `PageDown` / `空格` | 相同 |
| 上一屏，保留原开头两行 | `←` / `↑` / `PageUp` / `Shift + 空格` | 相同 |
| 显示工作文档 | `Esc` | `Esc` |
| 恢复小说 | `Command + Shift + R` | `Ctrl + Shift + R` |
| 请求保存阅读位置 | `Command + S` | `Ctrl + S` |

阅读位置平时会自动保存，保存快捷键不会改写原 TXT。输入框和下拉框内的方向键保留原有操作，带 Ctrl / Command / Alt 的方向组合键不被阅读翻页接管。

两行重叠依据实际文本行定位；在文档首尾或视口不足三行时，会以边界和可前进距离为准。

## 工作文档切换

按 **Esc** 显示普通的项目工作汇报，并隐藏小说导航；按 `Ctrl / Command + Shift + R` 回到小说原位置。

如果正打开文件页或规则对话框，第一次 Esc 先关闭该页面，再按一次切换工作文档。

在“视图”或“文件 → 文档选项”中，可以启用 **切换窗口时显示工作文档**。此选项默认关闭；启用后，离开窗口会切换显示，返回时需主动按恢复快捷键。

## 编码与本地数据

### TXT 编码

支持 **UTF-8、GB18030 / GBK、Big5、UTF-16 LE、UTF-16 BE**。自动模式优先检查 BOM 和合法 UTF-8，再探测其他中文编码。

出现乱码时，在 **文件 → 文字编码** 中手动切换。编码识别有局限，手动选择原文件编码通常更可靠。

### 数据位置

| 系统 | 应用数据目录 |
| --- | --- |
| macOS | `~/Library/Application Support/reader-desktop/` |
| Windows | `%APPDATA%\reader-desktop\` |

目录中主要包含：

| 内容 | 位置 / 说明 |
| --- | --- |
| 最近阅读、进度、目录规则、字体清单 | `reader-state.json` |
| 导入的字体副本 | `fonts/` |
| 字体选择、缩放和界面偏好 | Chromium Local Storage |

Reader 记录文件路径，不复制小说正文；移动或删除原 TXT 后需要重新打开。“移除阅读记录”不删除原文件。软件没有书源、账号登录、云同步或小说上传功能。

项目源码目录、构建输出目录与以上应用数据目录相互独立。不要把日常小说和导入字体放进源码仓库。

## 常见问题

<details>
<summary><strong>为什么某些按钮没有反应？</strong></summary>

Reader 提供阅读所需的功能。标题栏和部分功能区控件是文档外观装饰，不是完整文字处理器。文件打开、字体排版、导航、查找、缩放、目录规则和工作文档切换可用。

</details>

<details>
<summary><strong>为什么目录不正确或没有目录？</strong></summary>

确认章节标题独立成行，然后在“目录选项”选择合适的预设，或根据标题格式自定义正则。没有匹配到标题时，会生成按长度划分的参考分节；原文不会改变。

</details>

<details>
<summary><strong>为什么状态栏的页数与 Word 不一样？</strong></summary>

正文连续显示。内部仍会将长文本分块，以进行虚拟渲染、预览和位置定位；状态栏显示的是这些参考分块，不是 Word 的打印页数。章节和卷边界不会强制换页。

</details>

<details>
<summary><strong>换电脑后会同步进度吗？</strong></summary>

不会自动同步。进度、排版偏好与导入字体只保存在本机。完整迁移需要迁移应用数据，同时确保原 TXT 文件路径可访问；不同系统间通常需要重新选择文件。

</details>

<details>
<summary><strong>为什么导入字体失败？</strong></summary>

确认文件是真正的 TrueType `.ttf`，没有损坏且不超过 32 MB。当前不导入 TTC、OTF、WOFF 或 WOFF2。最多保存 30 款自定义字体，可先在文件页移除不用的字体。

</details>

## 开发与构建

### 技术栈

| 层次 | 技术 |
| --- | --- |
| 桌面运行时 | Electron 45 |
| 界面 | React 19、TypeScript 7 |
| 前端构建 | Vite 8 |
| 长文本虚拟渲染 | TanStack Virtual |
| 字符编码 | iconv-lite、jschardet |
| 图标 | Lucide |
| 打包 | electron-builder |
| 验证 | Vitest、Playwright Electron |

### 本地启动

需要 **Node.js 24**（最低 22.12）和 npm。`.nvmrc` 指定开发版本，`package-lock.json` 锁定依赖。

```sh
# HTTPS
git clone https://github.com/SuperSaiyanJcy/reader.git

# 或 SSH
# git clone git@github.com:SuperSaiyanJcy/reader.git

cd reader
npm ci
npm run dev
```

### 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动前端开发服务器和 Electron |
| `npm run dev:web` | 只启动本地前端服务；本地文件能力需要 Electron |
| `npm run build` | TypeScript 检查与前端生产构建 |
| `npm test` | 编码、目录、分块、翻屏和字体单元测试 |
| `npm run test:e2e` | 构建并启动真实 Electron 窗口执行界面测试 |
| `npm run pack:mac` | 在 macOS 构建 arm64 DMG 和 ZIP |
| `npm run pack:win` | 在 Windows 构建 x64 安装器 EXE 和 ZIP |
| `npm run pack:win:zip` | 构建 Windows x64 免安装 ZIP |
| `node scripts/smoke-packaged.mjs` | 检查当前平台已打包应用的启动与示例阅读 |

打包结果统一输出到 `release/`。Mac 签名和 DMG 构建需要 macOS；Windows 安装器建议在 Windows 原生环境构建。项目不依赖原生 Node 扩展。

### 自动构建

[CI](https://github.com/SuperSaiyanJcy/reader/actions/workflows/ci.yml) 检查主分支与 Pull Request；[Build desktop apps](https://github.com/SuperSaiyanJcy/reader/actions/workflows/build.yml) 对版本标签或手动触发执行双平台打包。成功的标签构建会将安装包及 SHA-256 校验文件发布到 Releases。

完整流程见 [构建与发布](docs/发布说明.md)。

## 项目结构

```text
reader/
├── .github/workflows/    # 持续集成、双平台构建和发布
├── docs/                # 架构说明、发布文档、截图
├── electron/            # 主进程、受控 IPC、编码与 TTF 校验
├── resources/           # 应用图标与原创示例 TXT
├── scripts/             # 开发启动、图标生成、打包后检查
├── src/
│   ├── components/      # 功能区、导航、文件页、正文与规则弹窗
│   ├── lib/             # 目录、分块、翻读、字体和偏好设置
│   └── workers/         # TXT 和正则处理工作线程
├── tests/               # 单元测试和 Electron 端到端测试
├── CHANGELOG.md         # 版本记录
├── CONTRIBUTING.md      # 贡献说明
├── LICENSE              # MIT 许可证
└── README.md
```

`node_modules/`、`dist/`、`release/`、测试报告、应用快捷入口和本地数据均不提交。旧安装包可保存在本机 `release/archive/`，无需加入 Git 历史。

## 限制与验证

| 项目 | 当前边界 |
| --- | --- |
| 文档格式 | 仅 TXT，不支持 EPUB、PDF、DOC 或 DOCX |
| 单个 TXT | 最大 50 MB |
| 最近文档 | 最多 20 个 |
| 字体 | TTF，单个最大 32 MB，最多 30 款 |
| 自定义规则 | 最多 1000 字符；候选标题行最多 500 字符；约 2.5 秒超时 |
| 查找列表 | 最多展示前 500 个结果 |
| 页面预览 | 最多预览前 300 个参考分块；全文和目录仍可访问 |
| 发布签名 | macOS ad-hoc，Windows 无商业发行证书签名 |

本地验证包含 **34 项单元测试**和 **6 项端到端流程**，覆盖字符编码、目录匹配、长段落无丢字、emoji 边界、续读、字体导入、两行重叠翻读和连续排版接缝。平台构建与 CI 的最新状态请查看 Actions；界面测试不等同于覆盖所有系统、字体和实际使用场景。

## 贡献与许可证

欢迎通过 [Issues](https://github.com/SuperSaiyanJcy/reader/issues) 反馈问题，或阅读 [贡献说明](CONTRIBUTING.md) 后提交 Pull Request。安全问题见 [SECURITY.md](SECURITY.md)，版本变化见 [CHANGELOG.md](CHANGELOG.md)。

项目原创代码采用 [MIT License](LICENSE)。第三方组件保留各自许可证，详见 [第三方声明](THIRD_PARTY_NOTICES.md)；分发包附带相关许可证正文。内置示例为原创文本，测试不会向仓库提交系统字体。

目录识别参考了开源阅读软件按预设正则匹配标题的方法，规则与实现独立编写；没有复制完整阅读引擎或规则库。技术参考见 [设计说明](docs/设计说明.md)。
