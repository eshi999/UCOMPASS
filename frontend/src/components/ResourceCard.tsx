import type { Resource, ResourceCategory } from '../types';
import { Icon, type IconName } from './Icon';
import { TagChip } from './Chips';
import { useApp } from './AppContext';
import { dataService } from '../services/dataService';

export const categoryIcon: Record<ResourceCategory, IconName> = {
  Food: 'heart',
  Academics: 'book',
  Wellness: 'shield',
  Money: 'ticket',
  Career: 'arrowRight',
  International: 'sparkle',
  Community: 'users',
  Transportation: 'bus',
};

export function ResourceCard({ resource, compact }: { resource: Resource; compact?: boolean }) {
  const { saved, toggleSave, openResource } = useApp();
  const isSaved = saved.has(resource.id);
  const canOpen = !!dataService.getResource(resource.id);
  return (
    <article className={`card resource-card ${compact ? 'is-compact' : ''}`}>
      <div className="resource-top">
        <span className={`cat-icon cat-${resource.category.toLowerCase()}`}>
          <Icon name={categoryIcon[resource.category]} size={18} />
        </span>
        <div className="resource-head">
          <h3>{resource.name}</h3>
          <span className="resource-cat">{resource.category}</span>
        </div>
        <button
          className={`bookmark-btn ${isSaved ? 'is-saved' : ''}`}
          aria-label={isSaved ? `Remove ${resource.name} from saved` : `Save ${resource.name}`}
          aria-pressed={isSaved}
          onClick={() => toggleSave(resource.id, resource.name)}
        >
          <Icon name={isSaved ? 'bookmarkFill' : 'bookmark'} size={18} />
        </button>
      </div>
      <p className="resource-desc">{resource.description}</p>
      <div className="resource-foot">
        <div className="tag-row">
          {resource.location && <TagChip icon="pin">{resource.location}</TagChip>}
          {resource.cost && <TagChip tone={resource.cost.startsWith('Free') ? 'green' : 'neutral'}>{resource.cost}</TagChip>}
        </div>
        {canOpen && (
          <button className="text-action" onClick={() => openResource(resource.id)}>
            View details <Icon name="chevronRight" size={14} />
          </button>
        )}
      </div>
    </article>
  );
}
