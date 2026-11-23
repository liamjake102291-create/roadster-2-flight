import type { Vec3 } from '../types';

export interface Assembly {
  id: string;
  label: string;
  english: string;
  category: string;
  description: string;
  offset: Vec3;
  delay: number;
}

const layers: Assembly[] = [
  { id: 'body', label: '珠光白车身', english: 'Body shell', category: '车身', description: '连续的双门车身壳体，包含轮拱、侧裙和车门接缝。珠光白面漆上叠加高光清漆。', offset: [0, 2.06, 0], delay: 0.02 },
  { id: 'canopy', label: '烟色玻璃座舱罩', english: 'Glass canopy', category: '车身', description: '低弧度的深色玻璃座舱罩、边框与车顶饰条一起抬升。', offset: [0, 2.65, 0.18], delay: 0 },
  { id: 'fascia-front', label: '前保险杠与头灯', english: 'Front fascia', category: '车身', description: '前唇、下进气口和贯穿灯带在同一组，沿车头方向抽出。', offset: [0, 1.06, -0.95], delay: 0.10 },
  { id: 'fascia-rear', label: '后保险杠与扩散器', english: 'Rear fascia', category: '车身', description: '尾灯、后保险杠与底部导流鳍片整体向后分离。', offset: [0, 0.98, 0.97], delay: 0.12 },
  { id: 'nacelle', label: '尾部推进舱', english: 'Rear propulsion nacelle', category: '飞行系统', description: '车尾上方的独立导流罩带有进气格栅和后向喷口。', offset: [0.15, 2.03, 1.10], delay: 0.13 },
  { id: 'mirror-l', label: '左后视镜', english: 'Left mirror', category: '车身', description: '左侧镜壳、镜片及支架。', offset: [-0.64, 1.46, 0], delay: 0.15 },
  { id: 'mirror-r', label: '右后视镜', english: 'Right mirror', category: '车身', description: '右侧镜壳、镜片及支架。', offset: [0.64, 1.46, 0], delay: 0.15 },
  { id: 'cockpit', label: '座舱内饰', english: 'Cockpit', category: '座舱', description: '双座椅、仪表台、中央显示屏、转向柱和踏板。', offset: [0, 1.02, 0.05], delay: 0.21 },
  { id: 'chassis', label: '碳纤维底盘', english: 'Carbon chassis', category: '底盘', description: '车身中央承载结构，结合副车架、悬挂连杆和转向机构。', offset: [0, 0, 0], delay: 0.18 },
  { id: 'battery', label: '结构电池包', english: 'Structural battery', category: '电驱系统', description: '托盘内展示圆柱电芯、模组外壳、铜排和管理电路。保护板位于托盘底面。', offset: [0, -0.95, -0.13], delay: 0.27 },
  { id: 'drive-front', label: '前桥电驱总成', english: 'Front drive unit', category: '电驱系统', description: '前桥电机、逆变器、机壳及前端冷却部件。', offset: [0, -0.23, -0.88], delay: 0.19 },
  { id: 'drive-rear', label: '后桥双电驱', english: 'Rear dual drive', category: '电驱系统', description: '两台后桥电机及其逆变器，位于座舱后方。', offset: [0, -0.23, 1.12], delay: 0.21 },
  { id: 'fan-front', label: '前涵道风扇组', english: 'Front ducted fans', category: '飞行系统', description: '前侧两组涵道、叶轮、导流叶片及电机。', offset: [0, -1.74, -1.02], delay: 0.31 },
  { id: 'fan-rear', label: '后涵道风扇组', english: 'Rear ducted fans', category: '飞行系统', description: '后侧两组涵道、叶轮、导流叶片及电机。', offset: [0, -1.74, 0.83], delay: 0.32 },
  { id: 'tanks', label: '储气与供气组件', english: 'Gas storage and supply', category: '飞行系统', description: '复合材料储罐、阀组、歧管及压缩机的概念布置。', offset: [0, -2.37, 0.22], delay: 0.35 },
];

const corners = [
  { id: 'fl', label: '左前', english: 'Front left', side: -1, end: -1 },
  { id: 'fr', label: '右前', english: 'Front right', side: 1, end: -1 },
  { id: 'rl', label: '左后', english: 'Rear left', side: -1, end: 1 },
  { id: 'rr', label: '右后', english: 'Rear right', side: 1, end: 1 },
];

export const ASSEMBLIES: Assembly[] = [
  ...layers,
  ...corners.flatMap(({ id, label, english, side, end }): Assembly[] => [
    { id: 'wheel-' + id, label: label + '轮组', english: english + ' wheel', category: '轮刹', description: '橡胶轮胎、锻造轮圈、发光辐条和中心盖沿轮轴方向抽出。', offset: [side * 1.62, 0.35, end * 0.27], delay: 0.18 },
    { id: 'brake-' + id, label: label + '制动器', english: english + ' brake', category: '轮刹', description: '金属制动盘、盘面细节及夹持卡钳，与轮组分别展开。', offset: [side * 0.83, 0.28, end * 0.24], delay: 0.23 },
    { id: 'thruster-' + id, label: label + '下喷口', english: english + ' lift nozzle', category: '飞行系统', description: '轮内侧的下向喷口包含外壳和喉口。起飞与接地时，喷雾从此处发出。', offset: [side * 0.95, -1.0, end * 0.50], delay: 0.33 },
  ]),
];

export const ASSEMBLY_MAP = new Map(ASSEMBLIES.map((part) => [part.id, part]));
