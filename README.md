# SciDraw - 科研绘图编辑器 / Scientific Diagram Editor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-41.0-blue.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)

**中文** | [English](#english)

一款结合代码编辑与可视化拖拽的科研图表编辑器，支持导出 LaTeX TikZ 代码。

A scientific diagram editor combining code editing with visual drag-and-drop, supporting LaTeX TikZ export.

---

## 中文

### 功能特点

- **🔄 双向同步编辑** - 代码编辑与可视化画布实时同步，修改任意一端都会自动更新另一端
- **📦 多种节点类型** - 支持矩形、圆角矩形、圆形、菱形、流程图、数据框等6种形状
- **🔀 智能连线系统** - 自动计算最佳连线方向，支持手动调整起点/终点位置
- **🎯 曲线控制点** - 贝塞尔曲线、手动控制点，自由调整连线弯曲形状
- **📄 TikZ 导出** - 一键生成可编译的 LaTeX TikZ 代码，直接用于学术论文
- **📑 PDF 导出** - 直接导出图表为 PDF 格式，方便分享和打印
- **🎨 字体编辑** - 支持多种字体（宋体、黑体、Arial等）、字号、粗细设置
- **📝 文本框** - 可插入独立文本元素，支持自定义样式
- **🖱️ 拖拽标签** - 可自由移动节点、连线的标签位置
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

#### 打包分发
```bash
npm run dist
```
生成 Windows/macOS/Linux 可执行文件。

### 界面布局

```
┌────────────┬──────────────────┬─────────────────┬──────────────┐
│  节点工具栏  │   DSL 代码编辑器  │   可视化画布     │   属性面板   │
│            │                  │                 │              │
│ [矩形]     │  yaml 代码...    │   拖拽节点绘图   │  [标签文本]  │
│ [圆角矩形] │                  │                 │  [宽度/高度] │
│ [圆形]     │                  │                 │  [颜色设置]  │
│ [菱形]     │                  │                 │  [位置坐标]  │
│ [流程]     │                  │                 │              │
│ [数据]     │                  │                 │              │
│            │                  │                 │              │
│ ────────── │                  │                 │              │
│ [添加连线] │                  │                 │              │
└────────────┴──────────────────┴─────────────────┴──────────────┘
```

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
```

### 完整示例

```yaml
canvas:
  width: 800
  height: 600
  background: "#ffffff"

nodes:
  - id: input
    type: box
    x: 50
    y: 50
    width: 120
    height: 60
    label: "输入数据"
    style:
      fill: "#e3f2fd"
      stroke: "#2196f3"
      strokeWidth: 2

  - id: process
    type: rounded
    x: 220
    y: 40
    width: 140
    height: 80
    label: "数据处理"
    subtitle: "算法"
    style:
      fill: "#e8f5e9"
      stroke: "#4caf50"
      strokeWidth: 2

  - id: output
    type: box
    x: 420
    y: 50
    width: 120
    height: 60
    label: "输出结果"
    style:
      fill: "#fff3e0"
      stroke: "#ff9800"
      strokeWidth: 2

edges:
  - from: input
    to: process
    style: solid

  - from: process
    to: output
    style: solid
    label: "结果"
```

### TikZ 导出示例

上述示例导出的 TikZ 代码：

```latex
\documentclass{article}
\usepackage[utf8]{inputenc}
\usepackage{tikz}
\usetikzlibrary{shapes,arrows,positioning}

\begin{document}

\begin{tikzpicture}[
  node distance=1cm,
  box/.style={rectangle, rounded corners, minimum width=#1, minimum height=#2, text centered, draw=#3, fill=#4},
  arrow/.style={thick,->,>=stealth}
]

  \node[box={12cm}{6cm}{RGB}{33,150,243}{RGB}{227,242,253}] (input) at (5, 55) {输入数据};
  \node[box={14cm}{8cm}{RGB}{76,175,80}{RGB}{232,245,233}] (process) at (22, 56) {数据处理};
  \node[box={12cm}{6cm}{RGB}{255,152,0}{RGB}{255,243,224}] (output) at (42, 55) {输出结果};

  \draw[->] (input) -- (process);
  \draw[->] (process) -- (output);

\end{tikzpicture}

\end{document}
```

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
│       │   ├── WelcomeScreen.jsx    # 欢迎页面
│       │   ├── GuideOverlay.jsx     # 新手引导
│       │   ├── NodeToolbar.jsx      # 节点工具栏
│       │   └── NodePropertiesPanel.jsx  # 属性面板
│       ├── utils/            # 工具函数
│       │   ├── dslParser.js  # DSL 解析/序列化
│       │   ├── tikzExporter.js # TikZ 导出
│       │   └── i18n.js       # 国际化
│       ├── App.jsx           # 主应用组件
│       ├── index.jsx         # 入口文件
│       └── styles.css        # 样式文件
├── dist-renderer/            # 构建输出
├── package.json
└── vite.config.js
```

### 开发指南

```bash
# 安装依赖
npm install

# 开发模式（热重载）
npm run dev

# 构建渲染进程
npm run build:renderer

# 启动应用
npm run start

# 打包分发
npm run dist
```

### 已知问题

- 曲线控制点拖拽功能仍在优化中

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
- **📄 TikZ Export** - Generate compilable LaTeX TikZ code for academic papers
- **📑 PDF Export** - Export diagrams directly to PDF format for sharing and printing
- **🎨 Font Editing** - Support multiple fonts (Arial, Times New Roman, SimSun, etc.), font size, weight
- **📝 Text Boxes** - Insert standalone text elements with custom styling
- **🖱️ Draggable Labels** - Freely move node and edge label positions
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

#### Build Distribution
```bash
npm run dist
```
Generates Windows/macOS/Linux executables.

### DSL Syntax

Define diagrams using YAML format:

```yaml
canvas:
  width: 800
  height: 600
  background: "#ffffff"

nodes:
  - id: input
    type: box           # box/rounded/circle/diamond/process/data
    x: 50
    y: 50
    width: 120
    height: 60
    label: "Input Data"
    style:
      fill: "#e3f2fd"
      stroke: "#2196f3"
      strokeWidth: 2

edges:
  - from: input
    to: process
    style: solid        # solid/dashed/dotted
    fromDir: auto       # auto/left/right/top/bottom
    toDir: auto
```

### Tech Stack

- **Electron** - Cross-platform desktop framework
- **React** - UI component library
- **Vite** - Fast build tool
- **Monaco Editor** - VS Code's code editor
- **SVG** - Vector graphics rendering
- **js-yaml** - YAML parser

### Development

```bash
# Install dependencies
npm install

# Development mode (hot reload)
npm run dev

# Build renderer
npm run build:renderer

# Start application
npm run start

# Build distribution
npm run dist
```

### Known Issues

- Curve control point dragging is still being optimized

### License

[MIT License](LICENSE)
