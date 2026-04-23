export const SHAPE_GROUPS = [
  {
    id: 'general',
    label: { zh: '通用', en: 'General' },
    shapes: [
      { type: 'box', name: { zh: '矩形', en: 'Rectangle' }, icon: '▭', style: { width: 120, height: 60, fill: '#e3f2fd', stroke: '#2196f3', label: '' } },
      { type: 'rounded', name: { zh: '圆角矩形', en: 'Rounded' }, icon: '▢', style: { width: 120, height: 60, fill: '#e8f5e9', stroke: '#4caf50', label: '' } },
      { type: 'circle', name: { zh: '圆形', en: 'Circle' }, icon: '○', style: { width: 80, height: 80, fill: '#fce4ec', stroke: '#e91e63', label: '' } },
      { type: 'ellipse', name: { zh: '椭圆', en: 'Ellipse' }, icon: '⬭', style: { width: 120, height: 72, fill: '#ede7f6', stroke: '#7e57c2', label: '' } },
      { type: 'diamond', name: { zh: '菱形', en: 'Diamond' }, icon: '◇', style: { width: 100, height: 100, fill: '#fff3e0', stroke: '#ff9800', label: '' } },
      { type: 'triangle', name: { zh: '三角形', en: 'Triangle' }, icon: '△', style: { width: 100, height: 90, fill: '#fff8e1', stroke: '#f9a825', label: '' } }
    ]
  },
  {
    id: 'flowchart',
    label: { zh: '流程图', en: 'Flowchart' },
    shapes: [
      { type: 'process', name: { zh: '流程', en: 'Process' }, icon: '⬡', style: { width: 140, height: 58, fill: '#f3e5f5', stroke: '#9c27b0', label: '' } },
      { type: 'data', name: { zh: '数据', en: 'Data' }, icon: '▱', style: { width: 120, height: 72, fill: '#e0f7fa', stroke: '#00acc1', label: '' } },
      { type: 'document', name: { zh: '文档', en: 'Document' }, icon: '⌔', style: { width: 128, height: 84, fill: '#f1f8e9', stroke: '#7cb342', label: '' } },
      { type: 'database', name: { zh: '数据库', en: 'Database' }, icon: '⛁', style: { width: 120, height: 90, fill: '#e8eaf6', stroke: '#5c6bc0', label: '' } },
      { type: 'terminator', name: { zh: '终止符', en: 'Terminator' }, icon: '◖◗', style: { width: 140, height: 58, fill: '#fbe9e7', stroke: '#f4511e', label: '' } },
      { type: 'preparation', name: { zh: '准备', en: 'Preparation' }, icon: '⬢', style: { width: 132, height: 70, fill: '#fff3e0', stroke: '#fb8c00', label: '' } }
    ]
  },
  {
    id: 'containers',
    label: { zh: '容器', en: 'Containers' },
    shapes: [
      { type: 'swimlane', name: { zh: '泳道', en: 'Swimlane' }, icon: '☰', style: { width: 220, height: 120, fill: '#fafafa', stroke: '#546e7a', label: '' } },
      { type: 'note', name: { zh: '便签', en: 'Note' }, icon: '🗎', style: { width: 132, height: 96, fill: '#fff8e1', stroke: '#ffb300', label: '' } },
      { type: 'package', name: { zh: '包', en: 'Package' }, icon: '⧉', style: { width: 160, height: 100, fill: '#eceff1', stroke: '#607d8b', label: '' } }
    ]
  }
];

export function getShapePreset(shapeType) {
  for (const group of SHAPE_GROUPS) {
    const shape = group.shapes.find((item) => item.type === shapeType);
    if (shape) {
      return shape;
    }
  }
  return SHAPE_GROUPS[0].shapes[0];
}
