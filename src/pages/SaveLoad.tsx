import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSaveLoad } from '@/hooks/useSaveLoad';
import GlassCard from '@/components/GlassCard';
import { Save, Download, Upload, Trash2, ArrowLeft, Clock, User } from 'lucide-react';
import type { SaveSlot } from '@/game/types';

export default function SaveLoad() {
  const navigate = useNavigate();
  const { getSaveSlots, saveGame, loadGame, deleteSave, downloadSaveFile, importSave, hasAutoSave } = useSaveLoad();
  const [slots, setSlots] = useState<SaveSlot[]>([]);
  const [importData, setImportData] = useState('');
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    setSlots(getSaveSlots());
  }, [getSaveSlots]);

  const refresh = () => setSlots(getSaveSlots());

  const handleSave = (slotId: number) => {
    const name = prompt('Enter save name:', `Save ${slotId}`);
    if (name) {
      saveGame(slotId, name);
      refresh();
    }
  };

  const handleLoad = (slotId: number) => {
    if (loadGame(slotId)) {
      navigate('/dashboard');
    }
  };

  const handleDelete = (slotId: number) => {
    if (confirm('Delete this save?')) {
      deleteSave(slotId);
      refresh();
    }
  };

  const handleImport = () => {
    if (!importData.trim()) return;
    const slotId = parseInt(prompt('Which slot to save to? (1-5)', '1') || '1');
    if (slotId >= 1 && slotId <= 5) {
      importSave(importData, slotId);
      setImportData('');
      setShowImport(false);
      refresh();
    }
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-deep-space pb-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-text-secondary hover:text-cyan-glow transition-colors mb-4">
          <ArrowLeft size={18} />
          <span className="font-rajdhani text-sm uppercase">Back</span>
        </button>

        <h1 className="page-title text-white mb-6">Save / Load Game</h1>

        {/* Auto-save indicator */}
        {hasAutoSave() && (
          <GlassCard className="mb-6 flex items-center gap-3" accentColor="#00E676">
            <Clock size={20} className="text-success" />
            <div>
              <p className="text-white font-rajdhani font-semibold">Auto-Save Available</p>
              <p className="text-text-secondary text-xs">Your game is automatically saved every turn.</p>
            </div>
          </GlassCard>
        )}

        {/* Import/Export */}
        <div className="flex gap-3 mb-6">
          <button onClick={() => setShowImport(!showImport)} className="btn-secondary flex items-center gap-2 text-sm">
            <Upload size={14} />
            Import Save
          </button>
        </div>

        {showImport && (
          <GlassCard className="mb-6">
            <h3 className="font-rajdhani font-semibold text-white mb-3">Import Save Data</h3>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste save JSON here..."
              className="w-full h-32 bg-void-navy border border-glass-border rounded-input p-3 text-xs font-mono text-white placeholder:text-text-dim/50 focus:border-cyan-glow focus:outline-none resize-none"
            />
            <div className="flex gap-2 mt-3">
              <button onClick={handleImport} className="btn-primary text-sm py-2">
                Import
              </button>
              <button onClick={() => setShowImport(false)} className="btn-secondary text-sm py-2">
                Cancel
              </button>
            </div>
          </GlassCard>
        )}

        {/* Save Slots */}
        <div className="grid gap-3">
          {[1, 2, 3, 4, 5].map((slotId) => {
            const slot = slots.find(s => s.id === slotId);

            if (!slot) {
              return (
                <GlassCard key={slotId} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <Save size={18} className="text-text-dim" />
                  </div>
                  <div className="flex-1">
                    <p className="text-text-dim text-sm">Empty Slot {slotId}</p>
                  </div>
                  <button
                    onClick={() => handleSave(slotId)}
                    className="btn-primary text-xs py-2 px-4 flex items-center gap-1"
                  >
                    <Save size={12} />
                    Save
                  </button>
                </GlassCard>
              );
            }

            return (
              <GlassCard key={slotId} className="flex items-center gap-4" accentColor="#00F0FF">
                <div className="w-10 h-10 rounded-lg bg-cyan-glow/10 flex items-center justify-center shrink-0">
                  <User size={18} className="text-cyan-glow" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-rajdhani font-semibold text-white">{slot.name}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-text-secondary uppercase">{slot.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-text-dim font-mono mt-0.5">
                    <span>{slot.playerName}</span>
                    <span>|</span>
                    <span>Net: S${(slot.netWorth / 1000000).toFixed(2)}M</span>
                    <span>|</span>
                    <span>Turn {slot.turnCount}</span>
                    <span>|</span>
                    <span>{slot.year}-{String(slot.month).padStart(2, '0')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleLoad(slotId)} className="btn-primary text-xs py-2 px-3">
                    Load
                  </button>
                  <button onClick={() => downloadSaveFile(slotId)} className="p-2 rounded-lg border border-glass-border text-cyan-glow hover:bg-cyan-glow/10 transition-all">
                    <Download size={14} />
                  </button>
                  <button onClick={() => handleDelete(slotId)} className="p-2 rounded-lg border border-glass-border text-danger hover:bg-danger/10 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
