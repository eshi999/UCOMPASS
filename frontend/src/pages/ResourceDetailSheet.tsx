import { useRef } from 'react';
import { BottomSheet } from '../components/AppShell';
import { useApp } from '../components/AppContext';
import { Icon, type IconName } from '../components/Icon';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import { categoryIcon } from '../components/ResourceCard';
import { dataService } from '../services/dataService';

function Row({ icon, label, value }: { icon: IconName; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="detail-row">
      <span className="detail-icon">
        <Icon name={icon} size={16} />
      </span>
      <div>
        <span className="detail-label">{label}</span>
        <p>{value}</p>
      </div>
    </div>
  );
}

// Screen 8: resource detail as a bottom sheet over any tab.
export function ResourceDetailSheet() {
  const { resourceId, closeResource, saved, toggleSave, toast } = useApp();
  const current = resourceId ? dataService.getResource(resourceId) : undefined;
  // Keep the last resource rendered while the sheet animates closed.
  const last = useRef(current);
  if (current) last.current = current;
  const r = last.current;
  const isSaved = r ? saved.has(r.id) : false;

  return (
    <BottomSheet open={!!current} onClose={closeResource} title={r?.name}>
      {r && (
        <>
          <div className="detail-hero">
            <span className={`cat-icon lg cat-${r.category.toLowerCase()}`}>
              <Icon name={categoryIcon[r.category]} size={22} />
            </span>
            <div>
              <span className="resource-cat">{r.category}</span>
              <h2>{r.name}</h2>
            </div>
          </div>
          <p className="detail-desc">{r.description}</p>

          <div className="detail-grid">
            <Row icon="users" label="Who it helps" value={r.whoItHelps} />
            <Row icon="ticket" label="Cost" value={r.cost} />
            <Row icon="check" label="Eligibility" value={r.eligibility} />
            <Row icon="pin" label="Location" value={r.location} />
            <Row icon="bus" label="Getting there" value={r.transportation} />
          </div>

          <div className="verify-note">
            <Icon name="info" size={16} />
            <div>
              <strong>Last verified: {r.lastVerified}</strong>
              <span>Check the official source for current hours and availability.</span>
            </div>
          </div>

          <div className="sheet-actions">
            <PrimaryButton icon="external" block onClick={() => toast('Official link goes here (demo)')}>
              Official website
            </PrimaryButton>
            <SecondaryButton icon={isSaved ? 'bookmarkFill' : 'bookmark'} block onClick={() => toggleSave(r.id, r.name)}>
              {isSaved ? 'Saved' : 'Save'}
            </SecondaryButton>
          </div>
        </>
      )}
    </BottomSheet>
  );
}
