# SciDraw - 科研绘图编辑器 / Scientific Diagram Editor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-41.0-blue.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)

**中文** | [English](#english)

一款结合代码编辑与可视化拖拽的科研图表编辑器，支持导入 TikZ 代码、插入图片、图层管理等功能。

A scientific diagram editor combining code editing with visual drag-and-drop, supporting TikZ import, image insertion, and layer management.

---

## 中文

### 功能特点

- **🔄 双向同步编辑** - 代码编辑与可视化画布实时同步，修改任意一端都会自动更新另一端
- **📦 多种节点类型** - 支持矩形、圆角矩形、圆形、菱形、流程图、数据框等6种形状
- **🔀 智能连线系统** - 自动计算最佳连线方向，支持手动调整起点/终点位置
- **🎯 曲线控制点** - 贝塞尔曲线、手动控制点，自由调整连线弯曲形状
- **📥 导入 TikZ** - 支持导入 TikZ 代码并转换为可视化图表
- **📑 PDF 导出** - 直接导出图表为 PDF 格式，方便分享和打印
- **🖼️ 插入图片** - 支持从本地插入 JPG、PNG 等图片到画布
- **📚 图层管理** - 置于顶层、上移一层、下移一层、置于底层
- **🎨 字体编辑** - 支持多种字体（宋体、黑体、Arial等）、字号、粗细设置
- **📝 文本框** - 可插入独立文本元素，支持自定义样式
- **🖱️ 拖拽标签** - 可自由移动节点、连线的标签位置
- **🔍 画布缩放** - Ctrl+滚轮缩放画布，Alt+拖动平移
- **📏 可调面板** - 拖动面板边界调整大小
- **🌐 中英文界面** - 完整的中英文支持，方便不同用户使用
- **📖 新手引导** - 内置欢迎界面和使用教程，快速上手

### 安装

#### 环境要求
- Node.js >= 16.0
- npm >= 8.0

#### 克隆项目
```bash
git clone https://github.com/sitns/scidraw.git
cd scidraw
npm install
```

### 使用方法

#### 开发模式
```bash
npm run dev
```
启动 Vite 开发服务器和 Electron 应用。

#### 生产模式
```bash
npm run build:renderer
npm run start
```

#### 打包成可执行文件 (Windows)

**方法一：使用 electron-builder 自动打包**
```bash
npm run dist
```
打包后的 exe 文件在 `dist` 目录中。

**方法二：手动运行（无需打包）**
```bash
# 先构建
npm run build:renderer

# 然后直接运行 Electron
npx electron .
```

### 界面布局

```
┌────────────┬──────────────────┬─────────────────┬──────────────┐
│  节点工具栏  │   DSL 代码编辑器  │   可视化画布     │   属性面板   │
│            │                  │                 │              │
│ [矩形]     │  yaml 代码...    │   拖拽节点绘图   │  [标签文本]  │
│ [圆角矩形] │                  │                 │  [宽度/高度] │
│ [圆形]     │                  │                 │  [颜色设置]  │
│ [菱形]     │                  │                 │  [位置坐标]  │
│ [流程]     │                  │                 │  [字体设置]  │
│ [数据]     │                  │                 │              │
│ [文本框]   │                  │                 │  ──────────  │
│ [插入图片] │                  │                 │  [图层控制]  │
│            │                  │                 │              │
│ ────────── │                  │                 │              │
│ [添加连线] │                  │                 │              │
└────────────┴──────────────────┴─────────────────┴──────────────┘
```

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + 滚轮` | 缩放画布 |
| `Alt + 左键拖动` | 平移画布 |
| `中键拖动` | 平移画布 |
| `Ctrl + N` | 新建文件 |
| `Ctrl + O` | 打开文件 |
| `Ctrl + S` | 保存文件 |
| `Ctrl + I` | 导入 TikZ |
| `Ctrl + P` | 导出 PDF |

### DSL 语法说明

使用 YAML 格式定义图表：

```yaml
# 画布配置
canvas:
  width: 800
  height: 600
  background: "#ffffff"

# 节点定义
nodes:
  - id: input           # 唯一标识
    type: box           # 类型: box/rounded/circle/diamond/process/data
    x: 50               # X坐标
    y: 50               # Y坐标
    width: 120          # 宽度
    height: 60          # 高度
    label: "输入数据"    # 标签文本
    subtitle: ""        # 副标题（可选）
    zIndex: 0           # 图层顺序
    style:
      fill: "#e3f2fd"       # 填充颜色
      stroke: "#2196f3"     # 边框颜色
      strokeWidth: 2        # 边框宽度

# 连线定义
edges:
  - from: input         # 起点节点ID
    to: process         # 终点节点ID
    label: ""           # 连线标签（可选）
    style: solid        # 线条样式: solid/dashed/dotted
    fromDir: auto       # 起点方向: auto/left/right/top/bottom
    toDir: auto         # 终点方向
    curveType: auto     # 曲线类型: auto/straight/bezier/bezier2/manual
    controlPoints: []   # 控制点坐标（用于手动曲线）

# 文本定义
texts:
  - id: text_1
    x: 100
    y: 100
    content: "文本内容"
    fontSize: 14
    fontWeight: normal
    color: "#000000"

# 图片定义
images:
  - id: image_1
    x: 100
    y: 100
    width: 200
    height: 150
    src: "[base64 image data]"
```

### 图层管理

选中元素后，可以使用图层控制按钮：
- **⬆️⬆** 置于顶层 - 将元素移到最前面
- **⬆️** 上移一层 - 将元素向上移动一层
- **⬇️** 下移一层 - 将元素向下移动一层
- **⬇️⬇** 置于底层 - 将元素移到最后面

### 插入图片

1. 点击左侧工具栏的"插入图片"按钮
2. 选择本地图片文件（支持 JPG、PNG、GIF、SVG 等格式）
3. 图片会自动添加到画布上
4. 可以拖动调整位置，选中后可删除

### 导入 TikZ

1. 点击工具栏的"导入 TikZ"按钮
2. 在弹出的对话框中粘贴 TikZ 代码
3. 点击"导入"按钮，代码会自动转换为可视化图表

### 技术栈

- **Electron** - 跨平台桌面应用框架
- **React** - UI 组件库
- **Vite** - 快速构建工具
- **Monaco Editor** - VS Code 同款代码编辑器
- **SVG** - 矢量图形渲染
- **js-yaml** - YAML 解析器

### 项目结构

```
scidraw/
├── src/
│   ├── main/                 # Electron 主进程
│   │   ├── main.js           # 主进程入口
│   │   └── preload.js        # 预加载脚本
│   └── renderer/             # 渲染进程
│       ├── components/       # React 组件
│       │   ├── WelcomeScreen.jsx      # 欢迎页面
│       │   ├── GuideOverlay.jsx       # 新手引导
│       │   ├── NodeToolbar.jsx        # 节点工具栏
│       │   ├── NodePropertiesPanel.jsx # 属性面板
│       │   └── TikZImportDialog.jsx   # TikZ 导入对话框
│       ├── utils/            # 工具函数
│       │   ├── dslParser.js    # DSL 解析/序列化
│       │   ├── tikzParser.js   # TikZ 解析
│       │   └── i18n.js         # 国际化
│       ├── App.jsx           # 主应用组件
│       ├── index.jsx         # 入口文件
│       └── styles.css        # 样式文件
├── dist-renderer/            # 构建输出
├── package.json
└── vite.config.js
```

### 许可证

[MIT License](LICENSE)

---

<a name="english"></a>

## English

### Features

- **🔄 Bidirectional Sync** - Real-time synchronization between code editor and visual canvas
- **📦 Multiple Node Types** - 6 shape types: box, rounded, circle, diamond, process, data
- **🔀 Smart Connections** - Auto-calculated optimal connection paths with manual direction control
- **🎯 Curve Control Points** - Bezier curves, manual control points for custom curve shapes
- **📥 Import TikZ** - Import TikZ code and convert to visual diagram
- **📑 PDF Export** - Export diagrams directly to PDF format for sharing and printing
- **🖼️ Insert Images** - Insert JPG, PNG images from local files to canvas
- **📚 Layer Management** - Bring to front, bring forward, send backward, send to back
- **🎨 Font Editing** - Support multiple fonts (Arial, Times New Roman, SimSun, etc.), font size, weight
- **📝 Text Boxes** - Insert standalone text elements with custom styling
- **🖱️ Draggable Labels** - Freely move node and edge label positions
- **🔍 Canvas Zoom** - Ctrl+scroll to zoom, Alt+drag to pan
- **📏 Resizable Panels** - Drag panel borders to resize
- **🌐 i18n Support** - Complete Chinese and English interface
- **📖 Beginner Guide** - Built-in welcome screen and tutorial

### Installation

#### Requirements
- Node.js >= 16.0
- npm >= 8.0

#### Clone Project
```bash
git clone https://github.com/sitns/scidraw.git
cd scidraw
npm install
```

### Usage

#### Development Mode
```bash
npm run dev
```
Starts Vite dev server and Electron app.

#### Production Mode
```bash
npm run build:renderer
npm run start
```

#### Build as Executable (Windows)

**Method 1: Using electron-builder**
```bash
npm run dist
```
The packaged exe file will be in the `dist` directory.

**Method 2: Run directly (no packaging needed)**
```bash
# Build first
npm run build:renderer

# Then run Electron directly
npx electron .
```

### Keyboard Shortcuts

| Shortcut | Function |
|----------|----------|
| `Ctrl + Scroll` | Zoom canvas |
| `Alt + Left-click drag` | Pan canvas |
| `Middle-click drag` | Pan canvas |
| `Ctrl + N` | New file |
| `Ctrl + O` | Open file |
| `Ctrl + S` | Save file |
| `Ctrl + I` | Import TikZ |
| `Ctrl + P` | Export PDF |

### Layer Management

Select an element and use layer control buttons:
- **⬆️⬆** Bring to Front - Move element to the very front
- **⬆️** Bring Forward - Move element up one layer
- **⬇️** Send Backward - Move element down one layer
- **⬇️⬇** Send to Back - Move element to the very back

### Insert Images

1. Click "Insert Image" button in the left toolbar
2. Select a local image file (supports JPG, PNG, GIF, SVG)
3. The image will be added to the canvas
4. Drag to reposition, select to delete

### Import TikZ

1. Click "Import TikZ" button in the toolbar
2. Paste TikZ code in the dialog
3. Click "Import" to convert the code to visual diagram

### Tech Stack

- **Electron** - Cross-platform desktop framework
- **React** - UI component library
- **Vite** - Fast build tool
- **Monaco Editor** - VS Code's code editor
- **SVG** - Vector graphics rendering
- **js-yaml** - YAML parser

### License

[MIT License](LICENSE)
