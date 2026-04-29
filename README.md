# SciDraw - 科研绘图编辑器 / Scientific Diagram Editor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-41.0-blue.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)

**中文** | [English](#english)

结合 YAML DSL 与可视化画布的桌面科研图编辑器。当前版本重点覆盖 SciDraw DSL 双向编辑、TikZ / Mermaid / draw.io 导入、图片与文本排版、无限画布，以及适合流程图和科研示意图的快速绘制体验。

A desktop scientific diagram editor that combines a YAML DSL with a visual canvas. The current build focuses on bidirectional SciDraw DSL editing, TikZ / Mermaid / draw.io import, image and text layout, an infinite canvas, and fast authoring for flowcharts and scientific diagrams.

---

## 中文

### 当前能力

- **YAML DSL + 画布双向同步**: 修改代码或拖拽画布元素都会回写到另一侧。
- **15 个内置形状**: `box`、`rounded`、`circle`、`ellipse`、`diamond`、`triangle`、`process`、`data`、`document`、`database`、`terminator`、`preparation`、`swimlane`、`note`、`package`。
- **无限画布**: 画布会根据内容自动扩展，支持网格背景、缩放、平移和导出边界裁切。
- **文本与图片元素**: 可插入独立文本框和本地图片，支持图片缩放、透明度、`cover` / `contain` / `fill` 填充模式与裁剪区域。
- **框选与绑定/解绑**: 左键或右键在画布空白区域拖拽即可框选多个节点 / 文本 / 图片，并可将它们绑定为持久分组，之后拖动任一成员会整组联动。
- **连线编辑**: 支持节点间连线、线型切换、曲线模式切换、标签拖拽和图层调整。
- **多来源导入**: 支持 TikZ、Mermaid，以及最小可用版本的 draw.io / diagrams.net XML 导入。
- **PDF 打印导出**: 导出时按实际图形边界裁切，减少大片空白。
- **桌面应用体验**: Electron 菜单、顶部工具栏、中英文界面、欢迎页和引导页都可用。
- **文件变更追踪**: 代码或画布发生修改后自动标记脏状态。关闭窗口或退出时若有未保存更改，会弹出原生保存/放弃/取消对话框，避免误关丢失数据。

### 当前限制

- **draw.io 导入是 MVP 解析器**: 当前支持未压缩的 `mxGraph` XML 和未压缩 `.drawio` 内容，做了基础顶点 / 连线提取与部分样式映射。压缩文件和高级样式细节暂不支持。
- **Mermaid / TikZ 导入是轻量解析**: 当前覆盖常见语法路径，不是完整语言实现。
- **框选与绑定暂不包含连线**: 多选和持久分组目前只作用于节点、文本、图片。
- **图片尚未完整持久化到 YAML**: 保存的 YAML 会写入占位 `src`，不会内嵌原始图片二进制数据。当前会话内可从内存恢复，重新打开独立文件时需要重新插图。

### 安装

建议使用较新的 Node.js LTS 与 npm。

```bash
git clone https://github.com/sitns/scidraw.git
cd scidraw
npm install
```

### 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器并拉起 Electron |
| `npm run build:renderer` | 构建 renderer 到 `dist-renderer/` |
| `npm run start` | 运行 Electron，需先执行 `npm run build:renderer` |
| `npm run pack` | 生成 electron-builder 目录包 |
| `npm run dist` | 打包桌面应用 |

### 使用流程

1. 顶部工具栏可执行 `新建 / 打开 / 保存 / 导入 / 导出 PDF`。
2. 左侧形状面板按分组提供内置图形、文本框和图片插入。
3. 中间区域包含 YAML 编辑器与可视化画布，二者实时同步。
4. 右侧属性面板使用纵向布局，可直接编辑节点、连线、文本和图片属性。

### 操作与快捷键

| 操作 | 说明 |
|------|------|
| `Ctrl/Cmd + 滚轮` | 缩放画布 |
| `Alt + 左键拖动` | 平移画布 |
| `中键拖动` | 平移画布 |
| 在空白区域拖拽（左键或右键） | 框选节点 / 文本 / 图片 |
| 拖拽节点标签或连线标签 | 调整标签位置 |
| `Ctrl/Cmd + N` | 新建图表 |
| `Ctrl/Cmd + O` | 打开 YAML / JSON / draw.io / XML |
| `Ctrl/Cmd + S` | 保存当前 YAML |
| `Ctrl/Cmd + I` | 打开 TikZ 导入对话框 |
| `Ctrl/Cmd + P` | 打开当前图表的 PDF 打印导出视图 |

### DSL 示例

```yaml
canvas:
  background: "#ffffff"
  infinite: true

nodes:
  - id: input
    type: rounded
    x: 120
    y: 120
    width: 160
    height: 80
    label: "输入"
    subtitle: "可选副标题"
    groupId: group_1
    style:
      fill: "#e8f5e9"
      stroke: "#4caf50"
      strokeWidth: 2

  - id: decision
    type: diamond
    x: 420
    y: 110
    width: 120
    height: 120
    label: "判断"
    style:
      fill: "#fff3e0"
      stroke: "#ff9800"
      strokeWidth: 2

edges:
  - id: edge_1
    from: input
    to: decision
    label: "流程"
    style: solid
    curveType: straight

texts:
  - id: note_1
    x: 120
    y: 300
    content: "独立文本"
    fontSize: 14

images:
  - id: image_1
    x: 620
    y: 100
    width: 220
    height: 140
    fit: contain
    opacity: 0.9
    crop:
      x: 0
      y: 0
      width: 1
      height: 1
```

说明:
`groupId` 用于持久分组移动。
`images` 当前不会把原始二进制图片内容写入 YAML。

### 技术栈

- Electron
- React
- Vite
- Monaco Editor（加载失败时会回退到普通文本框）
- SVG
- js-yaml

### 许可证

[MIT License](LICENSE)

---

<a name="english"></a>

## English

### Current Capabilities

- **Bidirectional YAML + canvas editing**: edits in the code pane and on the visual canvas sync both ways.
- **15 built-in shapes**: `box`, `rounded`, `circle`, `ellipse`, `diamond`, `triangle`, `process`, `data`, `document`, `database`, `terminator`, `preparation`, `swimlane`, `note`, `package`.
- **Infinite canvas**: the canvas expands with content and supports grid rendering, zoom, pan, and trimmed export bounds.
- **Text and images**: insert standalone text blocks and local images, then edit image size, opacity, crop region, and `cover` / `contain` / `fill` fit modes.
- **Marquee select and bind/unbind**: drag with left or right mouse button on empty canvas to select multiple nodes / texts / images and bind them into a persistent movement group.
- **Edge editing**: create node-to-node edges, change line style and curve mode, drag labels, and reorder layers.
- **Import paths**: import TikZ, Mermaid, and MVP-level draw.io / diagrams.net XML.
- **Cropped PDF print export**: export uses the actual diagram bounds to reduce empty margins.
- **Desktop app flow**: Electron menus, top toolbar, bilingual UI, welcome screen, and guide overlay are included.
- **Unsaved-change tracking**: the editor automatically tracks dirty state. Closing the window or quitting with unsaved changes shows a native Save / Discard / Cancel dialog to prevent accidental data loss.

### Current Limitations

- **draw.io support is intentionally minimal right now**: it currently supports uncompressed `mxGraph` XML and uncompressed `.drawio` content, with basic vertex/edge extraction and partial style mapping. Compressed files and advanced style fidelity are not supported yet.
- **Mermaid and TikZ importers are lightweight parsers**: they cover common input patterns, not the full language specs.
- **Marquee selection and binding do not include edges**: those features currently apply only to nodes, texts, and images.
- **Images are not fully persisted in YAML yet**: saved YAML writes a placeholder `src` instead of embedding the original image bytes. Images can be restored from memory during the current session, but a reopened standalone file will require reinserting them.

### Installation

Use a recent Node.js LTS release and npm.

```bash
git clone https://github.com/sitns/scidraw.git
cd scidraw
npm install
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server and Electron together |
| `npm run build:renderer` | Build the renderer into `dist-renderer/` |
| `npm run start` | Run Electron after building the renderer |
| `npm run pack` | Create an unpacked electron-builder directory build |
| `npm run dist` | Package the desktop app |

### Workflow

1. Use the top toolbar for `New / Open / Save / Import / Export PDF`.
2. Use the left palette for shapes, text boxes, image insertion, edge creation, and bind/unbind actions.
3. Edit YAML and the visual canvas side by side in the middle.
4. Use the right properties panel to edit node, edge, text, and image settings in a single vertical layout.

### Controls And Shortcuts

| Action | Description |
|--------|-------------|
| `Ctrl/Cmd + Scroll` | Zoom the canvas |
| `Alt + Left drag` | Pan the canvas |
| `Middle drag` | Pan the canvas |
| Drag on empty canvas (left or right button) | Marquee-select nodes / texts / images |
| Drag node labels or edge labels | Reposition labels |
| `Ctrl/Cmd + N` | New diagram |
| `Ctrl/Cmd + O` | Open YAML / JSON / draw.io / XML |
| `Ctrl/Cmd + S` | Save current YAML |
| `Ctrl/Cmd + I` | Open the TikZ import dialog |
| `Ctrl/Cmd + P` | Open the PDF print/export view |

### DSL Example

```yaml
canvas:
  background: "#ffffff"
  infinite: true

nodes:
  - id: input
    type: rounded
    x: 120
    y: 120
    width: 160
    height: 80
    label: "Input"
    subtitle: "optional"
    groupId: group_1
    style:
      fill: "#e8f5e9"
      stroke: "#4caf50"
      strokeWidth: 2

  - id: decision
    type: diamond
    x: 420
    y: 110
    width: 120
    height: 120
    label: "Decision"
    style:
      fill: "#fff3e0"
      stroke: "#ff9800"
      strokeWidth: 2

edges:
  - id: edge_1
    from: input
    to: decision
    label: "Flow"
    style: solid
    curveType: straight

texts:
  - id: note_1
    x: 120
    y: 300
    content: "Standalone text"
    fontSize: 14

images:
  - id: image_1
    x: 620
    y: 100
    width: 220
    height: 140
    fit: contain
    opacity: 0.9
    crop:
      x: 0
      y: 0
      width: 1
      height: 1
```

Notes:
`groupId` enables persistent grouped movement.
`images` are not fully embedded into saved YAML yet.

### Tech Stack

- Electron
- React
- Vite
- Monaco Editor with a plain textarea fallback
- SVG
- js-yaml

### License

[MIT License](LICENSE)
