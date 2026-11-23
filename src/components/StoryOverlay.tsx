import type { ViewMode } from '../types';
import { inspectionVisible } from '../scroll/math';
import { flight, HANDOFF, LANDING, maneuverSeconds, montage } from '../scene/launchTimeline';

interface Props {
  progress: number;
  playing: boolean;
  mode: ViewMode;
  onMode: (mode: ViewMode) => void;
  onSeek: (progress: number) => void;
  onPlay: () => void;
  onOpenLab: () => void;
}

const chapters = [
  { id: '01', at: 0, jump: 0, label: '开场', english: 'FLIGHT PROLOGUE', title: 'ROADSTER', copy: '' },
  { id: '02', at: montage.overhead, jump: 0.232, label: '上电', english: 'SYSTEMS ONLINE', title: '坡脚待发', copy: '灯组点亮，车辆驶入发射跑道。' },
  { id: '03', at: montage.approach, jump: 0.322, label: '爬坡', english: 'RAMP ASCENT', title: '坡道加速', copy: '沿弧面爬升并在过悬坡顶停稳。' },
  { id: '04', at: montage.fly, jump: 0.369, label: '起飞', english: 'POWERED FLIGHT', title: '脱轨起飞', copy: '越过坡顶，冷气喷流介入并稳住车身。' },
  { id: '05', at: 0.45, jump: 0.52, label: '拆解', english: 'EXPLODED VIEW', title: '分层拆解', copy: '覆盖件、座舱、底盘和推进系统依次分离。' },
  { id: '06', at: 0.66, jump: 0.69, label: '检视', english: 'ASSEMBLY INSPECTION', title: '总成检视', copy: '从列表或画面中选择一个总成。' },
  { id: '07', at: 0.73, jump: 0.825, label: '复装', english: 'REASSEMBLY', title: '空中复装', copy: '分离的组件沿原路径归位。' },
  { id: '08', at: 0.86, jump: 0.937, label: '降落', english: 'POWERED LANDING', title: '喷气降落', copy: '下喷缓降，贴地喷流向两侧扩散。' },
];

const prelude = [
  { at: montage.cabin, label: '座舱' },
  { at: montage.flow, label: '喷流预检' },
  { at: montage.scan, label: '结构扫描' },
  { at: montage.nozzle, label: '尾部推进舱' },
  { at: montage.silhouette, label: '车身轮廓' },
  { at: montage.lightbar, label: '灯组上电' },
];
const latestFirst = [...chapters].reverse();
const preludeLatestFirst = [...prelude].reverse();

const modes: { value: ViewMode; label: string }[] = [
  { value: 'surface', label: '外观' }, { value: 'xray', label: '透视' }, { value: 'orbit', label: '自由观察' },
];

export default function StoryOverlay({ progress, playing, mode, onMode, onSeek, onPlay, onOpenLab }: Props) {
  const chapter = latestFirst.find((item) => progress + 0.0001 >= item.at) ?? chapters[0];
  const isIntro = chapter.id === '01';
  const preludeLabel = preludeLatestFirst.find((item) => progress + 0.0001 >= item.at)?.label;
  const hover = progress >= HANDOFF && progress < 0.45;
  const seconds = maneuverSeconds(progress);
  const staged = (progress >= montage.lineup && progress <= HANDOFF + 0.002) || progress >= LANDING;
  const stage = seconds < flight.move ? '跑道待发'
    : seconds < flight.ramp ? '跑道加速'
    : seconds < flight.hang ? '沿坡爬升'
    : seconds < flight.boost ? '坡顶停驻'
    : seconds < flight.exit ? '尾喷推离'
    : seconds < flight.upright ? '离轨翻滚'
    : seconds < 15.65 ? '下喷承重 · 水平修正'
    : seconds < flight.hover ? '悬停稳定'
    : seconds < 17.4 ? '下喷缓降'
    : seconds < flight.touch ? '贴地制动'
    : seconds < flight.brake ? '接地滑行'
    : '停车制动';
  const inspection = mode === 'xray' || inspectionVisible(progress);
  const complete = progress >= 0.9995;
  const percent = Math.round(progress * 100);

  return (
    <div className="story-ui">
      <header className="flight-header">
        <button className="flight-mark" onClick={() => { onMode('surface'); onSeek(0); }} aria-label="Roadster 2，回到开场">
          <i aria-hidden="true" /><span>ROADSTER <b>2</b></span>
        </button>
        <div className="chapter-status" aria-live={playing ? 'off' : 'polite'}>
          <span>{chapter.id} / 08</span><span>{chapter.english}</span>
        </div>
        <button className="flight-link" onClick={onOpenLab}>零件工坊 <span aria-hidden="true">↗</span></button>
      </header>

      <section key={hover ? 'hover' : chapter.id}
        className={isIntro || (staged && !hover && !complete) ? 'flight-copy cinema-caption' : 'flight-copy flight-phase'} hidden={inspection}>
        {isIntro ? (
          <>
            <h1 className="cinema-name">ROADSTER <em>2</em></h1>
            <p className="flight-description">{preludeLabel}</p>
          </>
        ) : (
          <>
            <p className="flight-eyebrow">{complete ? 'FLIGHT COMPLETE' : hover ? 'HOLD FOR INSPECTION' : staged ? Math.max(0,seconds).toFixed(1) + ' s' : chapter.english}</p>
            <h2>{complete ? '演示结束' : hover ? '悬停就位' : staged ? stage : chapter.title}</h2>
            {(!staged || hover || complete) && <p className="flight-description">{complete ? '车辆已接地。' : hover ? '车辆稳定悬停，准备展开 27 组总成。' : chapter.copy}</p>}
          </>
        )}
        {hover && !playing && <button className="flight-cta" onClick={onPlay}>继续播放 <span aria-hidden="true">↗</span></button>}
        {complete && <button className="flight-cta" onClick={onPlay}>REPLAY · 重播 <span aria-hidden="true">↺</span></button>}
      </section>

      {mode === 'orbit' && <div className="orbit-hint">拖动旋转 · 双指或滚轮缩放</div>}

      <div className="flight-console">
        <div className="console-row">
          <button className="play-toggle" onClick={onPlay} aria-label={playing ? '暂停' : complete ? '重播' : '播放'}>
            {playing ? 'Ⅱ' : complete ? '↺' : '▶'}
          </button>
          <div className="timeline">
            <input type="range" min={0} max={1000} step={1} value={Math.round(progress * 1000)}
              onChange={(event) => onSeek(Number(event.target.value) / 1000)} aria-label="飞行进度"
              aria-valuetext={percent + '% · ' + chapter.label} style={{ '--played': percent + '%' } as React.CSSProperties} />
            <div className="chapter-buttons">
              {chapters.map((item) => (
                <button key={item.id} onClick={() => onSeek(item.jump)} aria-current={item.id === chapter.id ? 'step' : undefined}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <output className="flight-percent">{String(percent).padStart(2, '0')}<span>%</span></output>
          <div className="mode-buttons" role="group" aria-label="观察模式">
            {modes.map((item) => <button key={item.value} aria-pressed={mode === item.value} onClick={() => onMode(item.value)}>{item.label}</button>)}
          </div>
        </div>
      </div>
    </div>
  );
}

