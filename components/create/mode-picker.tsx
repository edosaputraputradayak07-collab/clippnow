'use client';

import { CONTENT_MODES, type ContentMode } from '../../src/lib/types/core';
import { getModeConfig } from '../../src/lib/modes';

type ModePickerProps = {
  value: ContentMode;
  onChange: (mode: ContentMode) => void;
};

const MODE_ICONS: Record<ContentMode, string> = {
  affiliate: '🛍️',
  seller: '🏪',
  live_seller: '🔴',
  podcast: '🎙️',
  educator: '🎓',
};

export function ModePicker({ value, onChange }: ModePickerProps) {
  return (
    <fieldset className="mode-picker">
      <legend className="section-title">Pilih Mode AI</legend>
      <p className="section-copy">AI akan menilai potongan video sesuai tujuan kontenmu.</p>
      <div className="mode-grid">
        {CONTENT_MODES.map((mode) => {
          const config = getModeConfig(mode);
          const selected = value === mode;
          return (
            <button
              key={mode}
              type="button"
              className={`mode-card${selected ? ' mode-card-selected' : ''}`}
              aria-pressed={selected}
              aria-label={`Pilih mode ${config.label}`}
              onClick={() => onChange(mode)}
            >
              <span className="mode-icon" aria-hidden="true">{MODE_ICONS[mode]}</span>
              <span className="mode-label">{config.label}</span>
              <span className="mode-description">{config.description}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
