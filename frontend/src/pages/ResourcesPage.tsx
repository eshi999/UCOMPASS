import { useMemo, useState } from 'react';
import type { ResourceCategory } from '../types';
import { ResourceCard, categoryIcon } from '../components/ResourceCard';
import { Icon } from '../components/Icon';
import { dataService } from '../services/dataService';

export function ResourcesPage() {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<ResourceCategory | null>(null);
  const all = dataService.getResources();
  const categories = dataService.getResourceCategories();

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter(
      (r) =>
        (!cat || r.category === cat) &&
        (!q || `${r.name} ${r.description} ${r.category}`.toLowerCase().includes(q)),
    );
  }, [all, cat, query]);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Resources</span>
          <h1>Campus help, in one place</h1>
        </div>
      </header>
      <div className="sticky-tools">
        <label className="search">
          <Icon name="search" size={18} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search resources" aria-label="Search resources" />
          {query && (
            <button aria-label="Clear search" onClick={() => setQuery('')}>
              <Icon name="close" size={16} />
            </button>
          )}
        </label>
        <div className="chip-scroll" role="tablist" aria-label="Categories">
          <button className={`cat-chip ${!cat ? 'is-active' : ''}`} onClick={() => setCat(null)} role="tab" aria-selected={!cat}>
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              className={`cat-chip ${cat === c ? 'is-active' : ''}`}
              onClick={() => setCat(cat === c ? null : c)}
              role="tab"
              aria-selected={cat === c}
            >
              <Icon name={categoryIcon[c]} size={14} /> {c}
            </button>
          ))}
        </div>
      </div>
      <div className="scroll">
        <p className="result-count">
          {list.length} {list.length === 1 ? 'resource' : 'resources'}
          {cat ? ` in ${cat}` : ''}
        </p>
        <div className="card-list">
          {list.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
          {list.length === 0 && (
            <div className="empty">
              <strong>No matches yet</strong>
              <span>Try another word, or ask Paw on the Talk tab.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
