import React, { useState, useRef, useEffect } from 'react';

function MermaidImportDialog({ isOpen, onClose, onImport, locale }) {
  const [code, setCode] = useState('');
  const [diagramType, setDiagramType] = useState('flowchart');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setCode('');
      setDiagramType('flowchart');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImport = () => {
    if (code.trim()) {
      onImport(code);
      setCode('');
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const examples = {
    flowchart: `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`,
    sequence: `sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: Hello Bob!
    B->>A: Hi Alice!
    A->>B: How are you?
    B->>A: I'm good, thanks!`,
    class: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +fetch()
    }
    Animal <|-- Dog`,
    state: `stateDiagram-v2
    [*] --> Idle
    Idle --> Processing: start
    Processing --> Complete: done
    Processing --> Error: fail
    Complete --> [*]
    Error --> Idle: retry`,
    er: `erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    USER {
        string name
        string email
    }
    ORDER {
        int id
        date created
    }`
  };

  return (
    <div className="mermaid-dialog-overlay" onKeyDown={handleKeyDown}>
      <div className="mermaid-dialog">
        <div className="mermaid-dialog-header">
          <span>{locale === 'zh' ? '导入 Mermaid 代码' : 'Import Mermaid Code'}</span>
          <button className="mermaid-dialog-close" onClick={onClose}>×</button>
        </div>
        <div className="mermaid-dialog-body">
          <div className="mermaid-dialog-type-row">
            <label className="mermaid-dialog-label">
              {locale === 'zh' ? '图表类型' : 'Diagram Type'}:
            </label>
            <select 
              className="mermaid-dialog-select"
              value={diagramType}
              onChange={(e) => {
                setDiagramType(e.target.value);
                setCode(examples[e.target.value] || '');
              }}
            >
              <option value="flowchart">{locale === 'zh' ? '流程图' : 'Flowchart'}</option>
              <option value="sequence">{locale === 'zh' ? '时序图' : 'Sequence'}</option>
              <option value="class">{locale === 'zh' ? '类图' : 'Class'}</option>
              <option value="state">{locale === 'zh' ? '状态图' : 'State'}</option>
              <option value="er">{locale === 'zh' ? 'ER图' : 'ER Diagram'}</option>
            </select>
            <button 
              className="mermaid-dialog-example-btn"
              onClick={() => setCode(examples[diagramType] || '')}
            >
              {locale === 'zh' ? '加载示例' : 'Load Example'}
            </button>
          </div>
          <p className="mermaid-dialog-hint">
            {locale === 'zh' 
              ? '支持 Mermaid 语法。选择图表类型后点击"加载示例"可查看示例代码。'
              : 'Supports Mermaid syntax. Select a diagram type and click "Load Example" to see sample code.'}
          </p>
          <textarea
            ref={textareaRef}
            className="mermaid-dialog-textarea"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={locale === 'zh' ? '在此粘贴 Mermaid 代码...' : 'Paste Mermaid code here...'}
          />
        </div>
        <div className="mermaid-dialog-footer">
          <button className="mermaid-dialog-btn cancel" onClick={onClose}>
            {locale === 'zh' ? '取消' : 'Cancel'}
          </button>
          <button className="mermaid-dialog-btn import" onClick={handleImport}>
            {locale === 'zh' ? '导入' : 'Import'}
          </button>
        </div>
      </div>
      <style>{`
        .mermaid-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .mermaid-dialog {
          background: #2d2d2d;
          border-radius: 8px;
          width: 700px;
          max-width: 90%;
          max-height: 85%;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        }
        .mermaid-dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #3e3e3e;
          font-size: 16px;
          font-weight: 600;
          color: #fff;
        }
        .mermaid-dialog-close {
          background: none;
          border: none;
          color: #999;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }
        .mermaid-dialog-close:hover {
          color: #fff;
        }
        .mermaid-dialog-body {
          padding: 20px;
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .mermaid-dialog-type-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .mermaid-dialog-label {
          color: #999;
          font-size: 13px;
        }
        .mermaid-dialog-select {
          padding: 6px 12px;
          background: #3e3e3e;
          border: 1px solid #555;
          color: #d4d4d4;
          border-radius: 4px;
          font-size: 13px;
          outline: none;
        }
        .mermaid-dialog-select:focus {
          border-color: #007acc;
        }
        .mermaid-dialog-example-btn {
          padding: 6px 12px;
          background: #5c6bc0;
          color: #fff;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }
        .mermaid-dialog-example-btn:hover {
          background: #7986cb;
        }
        .mermaid-dialog-hint {
          color: #999;
          font-size: 13px;
          margin: 0 0 12px 0;
        }
        .mermaid-dialog-textarea {
          flex: 1;
          min-height: 280px;
          background: #1e1e1e;
          border: 1px solid #3e3e3e;
          border-radius: 4px;
          color: #d4d4d4;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 13px;
          padding: 12px;
          resize: none;
          outline: none;
        }
        .mermaid-dialog-textarea:focus {
          border-color: #007acc;
        }
        .mermaid-dialog-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 20px;
          border-top: 1px solid #3e3e3e;
        }
        .mermaid-dialog-btn {
          padding: 8px 20px;
          font-size: 13px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .mermaid-dialog-btn.cancel {
          background: #3e3e3e;
          color: #d4d4d4;
        }
        .mermaid-dialog-btn.cancel:hover {
          background: #4e4e4e;
        }
        .mermaid-dialog-btn.import {
          background: #0e639c;
          color: #fff;
        }
        .mermaid-dialog-btn.import:hover {
          background: #1177bb;
        }
      `}</style>
    </div>
  );
}

export default MermaidImportDialog;
