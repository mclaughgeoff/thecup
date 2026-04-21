'use client';

import { useState } from 'react';

export interface OverrideState {
  pointsA: number | null;
  pointsB: number | null;
  label: string | null;
  note: string | null;
  overriddenBy: { id: string; name: string } | null;
  overriddenAt: string | null;
}

interface Props {
  matchId: string;
  teamAName: string;
  teamBName: string;
  initial: OverrideState;
  onSaved: (next: OverrideState | null) => void;
}

type Preset = 'none' | 'aWins' | 'halve' | 'bWins' | 'custom';

function presetFor(state: OverrideState): Preset {
  if (state.pointsA == null || state.pointsB == null) return 'none';
  if (state.pointsA === 1 && state.pointsB === 0) return 'aWins';
  if (state.pointsA === 0.5 && state.pointsB === 0.5) return 'halve';
  if (state.pointsA === 0 && state.pointsB === 1) return 'bWins';
  return 'custom';
}

export default function AdminOverridePanel({
  matchId,
  teamAName,
  teamBName,
  initial,
  onSaved,
}: Props) {
  const [preset, setPreset] = useState<Preset>(presetFor(initial));
  const [customA, setCustomA] = useState<string>(
    initial.pointsA != null ? String(initial.pointsA) : '',
  );
  const [customB, setCustomB] = useState<string>(
    initial.pointsB != null ? String(initial.pointsB) : '',
  );
  const [label, setLabel] = useState(initial.label ?? '');
  const [note, setNote] = useState(initial.note ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = initial.pointsA != null && initial.pointsB != null;

  const resolvePoints = (): { a: number | null; b: number | null } => {
    if (preset === 'none')  return { a: null, b: null };
    if (preset === 'aWins') return { a: 1, b: 0 };
    if (preset === 'halve') return { a: 0.5, b: 0.5 };
    if (preset === 'bWins') return { a: 0, b: 1 };
    const a = parseFloat(customA);
    const b = parseFloat(customB);
    if (Number.isNaN(a) || Number.isNaN(b)) return { a: null, b: null };
    return { a, b };
  };

  const handleSave = async () => {
    setError(null);
    const { a, b } = resolvePoints();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/matches/${matchId}/override`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pointsA: a,
          pointsB: b,
          label: label.trim() || null,
          note: note.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      if (a == null || b == null) {
        onSaved(null);
      } else {
        onSaved({
          pointsA: a,
          pointsB: b,
          label: label.trim() || null,
          note: note.trim() || null,
          overriddenBy: initial.overriddenBy,
          overriddenAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setPreset('none');
    setCustomA('');
    setCustomB('');
    setLabel('');
    setNote('');
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/matches/${matchId}/override`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Clear failed');
      onSaved(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to clear');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {active ? (
        <div className="p-3 rounded-xl border border-warning/30 bg-warning/10 text-xs text-warning leading-relaxed">
          <strong>Override active.</strong> The computed scorecard is not being
          used. Clear the override to resume live scoring.
        </div>
      ) : null}

      <div className="space-y-2">
        {[
          { key: 'none',  label: 'No override (use computed result)' },
          { key: 'aWins', label: `${teamAName} wins (1–0)` },
          { key: 'halve', label: 'Halved (0.5–0.5)' },
          { key: 'bWins', label: `${teamBName} wins (0–1)` },
          { key: 'custom', label: 'Custom points…' },
        ].map((opt) => {
          const isActive = preset === opt.key;
          return (
            <label
              key={opt.key}
              className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition ${
                isActive ? 'border-masters bg-masters/5' : 'border-ink-3 bg-white hover:bg-ink-2'
              }`}
            >
              <input
                type="radio"
                className="accent-masters"
                checked={isActive}
                onChange={() => setPreset(opt.key as Preset)}
              />
              <span className="text-sm text-fg-1">{opt.label}</span>
            </label>
          );
        })}
      </div>

      {preset === 'custom' ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Pts {teamAName}</label>
            <input
              className="input py-2"
              type="number"
              step="0.25"
              min="0"
              value={customA}
              onChange={(e) => setCustomA(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Pts {teamBName}</label>
            <input
              className="input py-2"
              type="number"
              step="0.25"
              min="0"
              value={customB}
              onChange={(e) => setCustomB(e.target.value)}
            />
          </div>
        </div>
      ) : null}

      <div>
        <label className="label">Label (optional)</label>
        <input
          className="input py-2"
          type="text"
          maxLength={48}
          placeholder="e.g. Halved at 16 — rain"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Note (optional)</label>
        <textarea
          className="input py-2 min-h-[88px]"
          maxLength={500}
          placeholder="Longer reasoning shown to players on the match detail page"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleClear}
          disabled={saving || !active}
          className="btn-ghost text-xs py-2"
        >
          Clear override
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary text-xs py-2"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
