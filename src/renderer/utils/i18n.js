export const translations = {
  en: {
    appTitle: 'SciDraw - Scientific Diagram Editor',
    toolbar: {
      open: 'Open',
      save: 'Save',
      importTikZ: 'Import TikZ',
      importMermaid: 'Import Mermaid',
      importDrawio: 'Import draw.io',
      exportPDF: 'Export PDF',
      newFile: 'New'
    },
    panels: {
      codeEditor: 'DSL Code (YAML)',
      visualCanvas: 'Visual Canvas'
    },
    statusBar: {
      nodes: 'nodes',
      edges: 'edges',
      codeToVisual: 'Code → Visual',
      visualToCode: 'Visual → Code'
    },
    welcome: {
      title: 'Welcome to SciDraw',
      subtitle: 'Scientific Diagram Editor',
      description: 'Create professional scientific diagrams with code and visual editing',
      getStarted: 'Get Started',
      features: {
        codeEditor: {
          title: 'Code Editor',
          desc: 'Write diagram definitions in YAML DSL'
        },
        visualEditor: {
          title: 'Visual Canvas',
          desc: 'Drag and drop to arrange elements'
        },
        export: {
          title: 'Export to TikZ',
          desc: 'Generate LaTeX TikZ code for papers'
        }
      },
      tryIt: 'Try the Example',
      skip: 'Skip'
    },
    guide: {
      step1: {
        title: 'Define Nodes',
        content: 'Add nodes to your diagram using YAML. Each node has position, size, and style.'
      },
      step2: {
        title: 'Connect with Edges',
        content: 'Create connections between nodes using the edges section.'
      },
      step3: {
        title: 'Visual Editing',
        content: 'Drag nodes on the canvas to reposition them. Changes sync back to code!'
      },
      step4: {
        title: 'Export',
        content: 'Export your diagram to TikZ LaTeX format for use in academic papers.'
      }
    },
    errors: {
      parseError: 'Parse Error'
    },
    contextMenu: {
      delete: 'Delete',
      duplicate: 'Duplicate',
      bringToFront: 'Bring to Front',
      sendToBack: 'Send to Back'
    }
  },
  zh: {
    appTitle: 'SciDraw - 科研绘图编辑器',
    toolbar: {
      open: '打开',
      save: '保存',
      importTikZ: '导入 TikZ',
      importMermaid: '导入 Mermaid',
      importDrawio: '导入 draw.io',
      exportPDF: '导出 PDF',
      newFile: '新建'
    },
    panels: {
      codeEditor: 'DSL 代码 (YAML)',
      visualCanvas: '可视化画布'
    },
    statusBar: {
      nodes: '个节点',
      edges: '条连线',
      codeToVisual: '代码 → 视图',
      visualToCode: '视图 → 代码'
    },
    welcome: {
      title: '欢迎使用 SciDraw',
      subtitle: '科研绘图编辑器',
      description: '使用代码和可视化编辑创建专业科研图表',
      getStarted: '开始使用',
      features: {
        codeEditor: {
          title: '代码编辑器',
          desc: '使用 YAML DSL 定义图表'
        },
        visualEditor: {
          title: '可视化画布',
          desc: '拖拽排列元素位置'
        },
        export: {
          title: '导出 TikZ',
          desc: '生成 LaTeX TikZ 代码用于论文'
        }
      },
      tryIt: '试试示例',
      skip: '跳过'
    },
    guide: {
      step1: {
        title: '定义节点',
        content: '使用 YAML 添加节点。每个节点都有位置、大小和样式。'
      },
      step2: {
        title: '连接节点',
        content: '使用 edges 部分在节点之间创建连接。'
      },
      step3: {
        title: '可视化编辑',
        content: '在画布上拖拽节点来重新定位。修改会自动同步到代码！'
      },
      step4: {
        title: '导出图表',
        content: '将图表导出为 TikZ LaTeX 格式，用于学术论文。'
      }
    },
    errors: {
      parseError: '解析错误'
    },
    contextMenu: {
      delete: '删除',
      duplicate: '复制',
      bringToFront: '置于顶层',
      sendToBack: '置于底层'
    }
  }
};

export function t(key, locale = 'zh') {
  const keys = key.split('.');
  let value = translations[locale] || translations.zh;
  
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return key;
    }
  }
  
  return value || key;
}

export function getLocale() {
  return localStorage.getItem('scidraw-locale') || 'zh';
}

export function setLocale(locale) {
  localStorage.setItem('scidraw-locale', locale);
}
