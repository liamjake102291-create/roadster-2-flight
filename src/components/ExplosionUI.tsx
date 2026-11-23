import { ASSEMBLIES, ASSEMBLY_MAP } from '../data/assemblies';
import type { ViewMode } from '../types';
import { inspectionVisible } from '../scroll/math';

interface Props {
  progress: number;
  selectedId: string;
  onSelect: (id: string) => void;
  mode: ViewMode;
}

export default function ExplosionUI({ progress, selectedId, onSelect, mode }: Props) {
  if (mode !== 'xray' && !inspectionVisible(progress)) return null;
  const selected = ASSEMBLY_MAP.get(selectedId) ?? ASSEMBLIES[0];
  return (
    <div className="inspection-ui">
      <aside className="assembly-index" aria-label="总成索引">
        <div className="inspection-heading"><span>总成</span><span>{ASSEMBLIES.length}</span></div>
        <label className="mobile-assembly">当前总成
          <select value={selectedId} onChange={(event) => onSelect(event.target.value)}>
            {ASSEMBLIES.map((part) => <option key={part.id} value={part.id}>{part.label}</option>)}
          </select>
        </label>
        <div className="assembly-options">
          {ASSEMBLIES.map((part, index) => (
            <button key={part.id} onClick={() => onSelect(part.id)}
              aria-label={part.label + ' · ' + part.english} aria-pressed={selectedId === part.id}>
              <span>{String(index + 1).padStart(2, '0')}</span>{part.label}
            </button>
          ))}
        </div>
      </aside>
      <aside className="assembly-detail detail-panel" aria-live="polite">
        <p>{selected.category} / {selected.english}</p>
        <h3>{selected.label}</h3>
        <p>{selected.description}</p>
      </aside>
    </div>
  );
}
