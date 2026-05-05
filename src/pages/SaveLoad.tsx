import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSaveLoad } from '@/hooks/useSaveLoad';
import { useGameStore } from '@/game/useGameStore';
import GlassCard from '@/components/GlassCard';
import { Save, Download, Upload, Trash2, ArrowLeft, Clock, User, Users, Smartphone, Clipboard, Cloud, UserPlus } from 'lucide-react';
import type { SaveProfile, SaveSlot } from '@/game/types';

export default function SaveLoad() {
  const navigate = useNavigate();
  const {
    getSaveSlots,
    saveGame,
    loadGame,
    deleteSave,
    downloadSaveFile,
    importSave,
    hasAutoSave,
    getProfiles,
    getActiveProfile,
    createProfile,
    deleteProfile,
    switchProfile,
    exportCurrentProfileBundle,
    importProfileBundleData,
    downloadProfileBundle,
  } = useSaveLoad();
  const isGameActive = useGameStore((state) => state.isGameActive);
  const [slots, setSlots] = useState<SaveSlot[]>(() => getSaveSlots());
  const [profiles, setProfiles] = useState<SaveProfile[]>(() => getProfiles());
  const [activeProfile, setActiveProfile] = useState<SaveProfile | null>(() => getActiveProfile());
  const [importData, setImportData] = useState('');
  const [profileTransferData, setProfileTransferData] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const profileFileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    setSlots(getSaveSlots());
    setProfiles(getProfiles());
    setActiveProfile(getActiveProfile());
  }, [getActiveProfile, getProfiles, getSaveSlots]);

  const handleCreateProfile = () => {
    const name = prompt('Profile name:', 'New Player');
    if (!name) return;
    const profile = createProfile(name);
    if (!profile) {
      setStatusMessage('Could not create profile. Browser storage may be unavailable.');
      return;
    }
    switchProfile(profile.id);
    refresh();
    setStatusMessage(`Profile "${profile.name}" is active. Start a new run or import a transfer file.`);
  };

  const handleSwitchProfile = (profileId: string) => {
    if (switchProfile(profileId)) {
      refresh();
      setStatusMessage('Profile switched. If it has an autosave, it has been loaded.');
    }
  };

  const handleDeleteProfile = (profileId: string) => {
    if (confirm('Delete this local profile and its saves on this device?')) {
      if (!deleteProfile(profileId)) {
        setStatusMessage('Guest Player cannot be deleted.');
        return;
      }
      refresh();
      setStatusMessage('Profile deleted from this device.');
    }
  };

  const handleSave = (slotId: number) => {
    const name = prompt('Enter save name:', `Save ${slotId}`);
    if (name) {
      saveGame(slotId, name);
      refresh();
      setStatusMessage(`Saved to ${activeProfile?.name ?? 'active profile'}.`);
    }
  };

  const handleLoad = (slotId: number) => {
    if (loadGame(slotId)) {
      navigate('/dashboard', { replace: true });
      if (window.location.hash !== '#/dashboard') {
        window.location.replace('#/dashboard');
      }
    }
  };

  const handleDelete = (slotId: number) => {
    if (confirm('Delete this save?')) {
      deleteSave(slotId);
      refresh();
      setStatusMessage('Save deleted.');
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
      setStatusMessage(`Imported save into Slot ${slotId} for ${activeProfile?.name ?? 'active profile'}.`);
    }
  };

  const handleDownloadProfile = () => {
    downloadProfileBundle(activeProfile?.id);
    setStatusMessage('Profile transfer file created. Send it through iCloud Drive, Google Drive, AirDrop, WhatsApp, or email.');
  };

  const handleCopyProfileBundle = async () => {
    try {
      await navigator.clipboard.writeText(exportCurrentProfileBundle(activeProfile?.id));
      setStatusMessage('Profile transfer code copied. Paste it on another device to import.');
    } catch {
      setStatusMessage('Copy failed in this browser. Use Download Profile instead.');
    }
  };

  const handleImportProfileBundle = (data = profileTransferData) => {
    if (!data.trim()) return;
    const result = importProfileBundleData(data);
    if (!result.ok) {
      setStatusMessage(result.message ?? 'Could not import this profile transfer file.');
      return;
    }

    setProfileTransferData('');
    setShowTransfer(false);
    refresh();
    setStatusMessage(`Imported ${result.profile.name} with ${result.importedSlots} slot${result.importedSlots === 1 ? '' : 's'}.`);
  };

  const handleProfileFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    handleImportProfileBundle(text);
    if (profileFileInputRef.current) profileFileInputRef.current.value = '';
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-deep-space pb-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-text-secondary hover:text-cyan-glow transition-colors mb-4">
          <ArrowLeft size={18} />
          <span className="font-rajdhani text-sm uppercase">Back</span>
        </button>

        <h1 className="page-title text-white mb-6">Save / Load Game</h1>

        {statusMessage && (
          <GlassCard className="mb-6" accentColor="#00F0FF">
            <p className="text-sm text-text-secondary">{statusMessage}</p>
          </GlassCard>
        )}

        <GlassCard className="mb-6" accentColor="#00F0FF">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Users size={22} className="text-cyan-glow" />
                <div>
                  <p className="font-rajdhani text-xl font-semibold text-white">Local Player Profiles</p>
                  <p className="text-sm text-text-secondary">
                    Separate autosaves and save slots for siblings, friends, or test runs on this device.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {profiles.map((profile) => {
                  const active = profile.id === activeProfile?.id;
                  return (
                    <div
                      key={profile.id}
                      className={`rounded-2xl border px-3 py-2 ${active ? 'border-cyan-glow/60 bg-cyan-glow/10' : 'border-glass-border bg-white/[0.03]'}`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSwitchProfile(profile.id)}
                        className="flex min-h-11 items-center gap-3 text-left"
                      >
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: profile.color }} />
                        <span>
                          <span className="block font-rajdhani text-sm font-semibold text-white">{profile.name}</span>
                          <span className="block text-[10px] uppercase tracking-[0.14em] text-text-dim">{active ? 'Active profile' : 'Tap to switch'}</span>
                        </span>
                      </button>
                      {profile.id !== 'guest' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteProfile(profile.id)}
                          className="mt-2 text-[10px] font-mono uppercase tracking-[0.12em] text-danger/80 hover:text-danger"
                        >
                          Delete local profile
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              <button onClick={handleCreateProfile} className="btn-primary flex items-center justify-center gap-2 text-sm">
                <UserPlus size={14} />
                New Profile
              </button>
              <button onClick={() => navigate('/newgame')} className="btn-secondary flex items-center justify-center gap-2 text-sm">
                Start Run for Profile
              </button>
            </div>
          </div>
        </GlassCard>

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

        <GlassCard className="mb-6" accentColor="#FFD740">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <Cloud size={22} className="mt-1 text-warning" />
              <div>
                <p className="font-rajdhani text-lg font-semibold text-white">Cloud / Phone Transfer</p>
                <p className="text-sm text-text-secondary">
                  Export this whole profile, then send the file through iCloud Drive, Google Drive, AirDrop, WhatsApp, or email. Import it on another phone to continue.
                </p>
                <p className="mt-1 text-xs text-text-dim">
                  No account-based cloud sync yet; this is a reliable manual transfer path that works across iPhone, Android, and desktop browsers.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleDownloadProfile} className="btn-primary flex items-center gap-2 text-sm">
                <Smartphone size={14} />
                Download Profile
              </button>
              <button onClick={handleCopyProfileBundle} className="btn-secondary flex items-center gap-2 text-sm">
                <Clipboard size={14} />
                Copy Code
              </button>
              <button onClick={() => setShowTransfer(!showTransfer)} className="btn-secondary flex items-center gap-2 text-sm">
                <Upload size={14} />
                Import Profile
              </button>
            </div>
          </div>
        </GlassCard>

        {showTransfer && (
          <GlassCard className="mb-6">
            <h3 className="font-rajdhani font-semibold text-white mb-3">Import Profile From Another Device</h3>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button onClick={() => profileFileInputRef.current?.click()} className="btn-primary flex items-center justify-center gap-2 text-sm">
                <Upload size={14} />
                Choose Profile File
              </button>
              <button onClick={() => handleImportProfileBundle()} className="btn-secondary text-sm">
                Import Pasted Code
              </button>
              <button onClick={() => setShowTransfer(false)} className="btn-secondary text-sm">
                Cancel
              </button>
            </div>
            <input
              ref={profileFileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => void handleProfileFile(event.target.files?.[0])}
            />
            <textarea
              value={profileTransferData}
              onChange={(e) => setProfileTransferData(e.target.value)}
              placeholder="Or paste a profile transfer code here..."
              className="mt-3 h-32 w-full resize-none rounded-input border border-glass-border bg-void-navy p-3 font-mono text-xs text-white placeholder:text-text-dim/50 focus:border-cyan-glow focus:outline-none"
            />
          </GlassCard>
        )}

        <div className="flex gap-3 mb-6">
          <button onClick={() => setShowImport(!showImport)} className="btn-secondary flex items-center gap-2 text-sm">
            <Upload size={14} />
            Import Single Save JSON
          </button>
        </div>

        {!isGameActive && (
          <GlassCard className="mb-6" accentColor="#FFD740">
            <p className="font-rajdhani font-semibold text-white">Start a run before saving</p>
            <p className="text-text-secondary text-sm mt-1">
              Save slots become available after a game is active, so beginners do not accidentally save the blank default profile.
            </p>
            <button onClick={() => navigate('/newgame')} className="btn-primary text-sm py-2 px-4 mt-4">
              Start New Game
            </button>
          </GlassCard>
        )}

        {showImport && (
          <GlassCard className="mb-6">
            <h3 className="font-rajdhani font-semibold text-white mb-3">Import One Save Slot</h3>
            <p className="mb-3 text-xs text-text-secondary">This imports an older single-slot JSON into the active profile: {activeProfile?.name ?? 'Guest Player'}.</p>
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
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-rajdhani text-lg font-semibold text-white">Save Slots</p>
            <p className="text-xs text-text-secondary">Showing slots for {activeProfile?.name ?? 'Guest Player'} only.</p>
          </div>
        </div>
        <div className="grid gap-3">
          {[1, 2, 3, 4, 5].map((slotId) => {
            const slot = slots.find(s => s.id === slotId);

            if (!slot) {
              return (
                <GlassCard key={slotId} className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <Save size={18} className="text-text-dim" />
                  </div>
                  <div className="flex-1">
                    <p className="text-text-dim text-sm">Empty Slot {slotId}</p>
                  </div>
                  <div className="flex sm:justify-end">
                    <button
                      onClick={() => handleSave(slotId)}
                      disabled={!isGameActive}
                      className="btn-primary flex min-h-11 items-center gap-1 px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                      title={isGameActive ? 'Save current run' : 'Start a run before saving'}
                    >
                      <Save size={12} />
                      Save
                    </button>
                  </div>
                </GlassCard>
              );
            }

            return (
              <GlassCard key={slotId} className="flex flex-col gap-4 sm:flex-row sm:items-center" accentColor="#00F0FF">
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
                  <button onClick={() => handleLoad(slotId)} className="btn-primary min-h-11 px-3 py-2 text-xs">
                    Load
                  </button>
                  <button onClick={() => downloadSaveFile(slotId)} className="min-h-11 min-w-11 rounded-lg border border-glass-border p-2 text-cyan-glow transition-all hover:bg-cyan-glow/10" aria-label={`Download slot ${slotId}`}>
                    <Download size={14} />
                  </button>
                  <button onClick={() => handleDelete(slotId)} className="min-h-11 min-w-11 rounded-lg border border-glass-border p-2 text-danger transition-all hover:bg-danger/10" aria-label={`Delete slot ${slotId}`}>
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
