import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/game/useGameStore';
import { difficultySettings } from '@/game/types';
import GlassCard from '@/components/GlassCard';
import { ArrowLeft, Volume2, Zap, RotateCcw, Type, SunMedium, Sparkles } from 'lucide-react';
import PageSceneHero from '@/components/visuals/PageSceneHero';

function quickToggleClass(active: boolean) {
  return `min-h-11 rounded-lg border px-4 py-3 text-sm font-rajdhani font-semibold uppercase tracking-wider transition-colors ${
    active
      ? 'border-success/35 bg-success/10 text-success hover:bg-success/15'
      : 'border-cyan-glow/30 bg-cyan-glow/10 text-cyan-glow hover:bg-cyan-glow/15'
  }`;
}

export default function Settings() {
  const navigate = useNavigate();
  const { settings, updateSettings, player, isGameActive } = useGameStore();

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-deep-space pb-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-text-secondary hover:text-cyan-glow transition-colors mb-4">
          <ArrowLeft size={18} />
          <span className="font-rajdhani text-sm uppercase">Back</span>
        </button>

        <PageSceneHero
          variant="learn"
          eyebrow="Settings"
          title="Tune the cockpit for your play style"
          subtitle="Guidance, Less Text View, accessibility, and animation settings help the same realistic sim feel readable for different players."
          className="mb-6"
          stats={[
            { label: 'Guided', value: settings.guidedMode ? 'On' : 'Off', tone: settings.guidedMode ? 'good' : 'neutral' },
            { label: 'Less Text', value: settings.compactMode ? 'On' : 'Off', tone: settings.compactMode ? 'good' : 'neutral' },
            { label: 'Large Text', value: settings.largeTextMode ? 'On' : 'Off', tone: settings.largeTextMode ? 'good' : 'neutral' },
          ]}
          actions={(
            <>
              <button
                type="button"
                aria-pressed={settings.guidedMode}
                aria-label={settings.guidedMode ? 'Turn guided help off' : 'Turn guided help on'}
                onClick={() => updateSettings({ guidedMode: !settings.guidedMode })}
                className={quickToggleClass(settings.guidedMode)}
              >
                Guided {settings.guidedMode ? 'On' : 'Off'}
              </button>
              <button
                type="button"
                aria-pressed={settings.compactMode}
                aria-label={settings.compactMode ? 'Turn off Less Text View and show full guide text' : 'Turn on Less Text View'}
                onClick={() => updateSettings({ compactMode: !settings.compactMode })}
                className={quickToggleClass(settings.compactMode)}
              >
                Less Text {settings.compactMode ? 'On' : 'Off'}
              </button>
              <button
                type="button"
                aria-pressed={settings.largeTextMode}
                aria-label={settings.largeTextMode ? 'Turn large text mode off' : 'Turn large text mode on'}
                onClick={() => updateSettings({ largeTextMode: !settings.largeTextMode })}
                className={quickToggleClass(settings.largeTextMode)}
              >
                Large Text {settings.largeTextMode ? 'On' : 'Off'}
              </button>
              <button
                type="button"
                aria-pressed={settings.highContrastMode}
                aria-label={settings.highContrastMode ? 'Turn high contrast mode off' : 'Turn high contrast mode on'}
                onClick={() => updateSettings({ highContrastMode: !settings.highContrastMode })}
                className={quickToggleClass(settings.highContrastMode)}
              >
                High Contrast {settings.highContrastMode ? 'On' : 'Off'}
              </button>
            </>
          )}
        />

        {/* Audio */}
        <GlassCard className="mb-4">
          <h3 className="section-title text-white mb-4 flex items-center gap-2">
            <Volume2 size={20} className="text-cyan-glow" />
            Audio
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm">Sound Effects</p>
                <p className="text-text-dim text-xs">Button clicks and notifications</p>
              </div>
              <button
                onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                aria-pressed={settings.soundEnabled}
                aria-label={settings.soundEnabled ? 'Turn sound effects off' : 'Turn sound effects on'}
                className={`w-12 h-6 rounded-full transition-all ${settings.soundEnabled ? 'bg-cyan-glow' : 'bg-white/10'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm">Background Music</p>
                <p className="text-text-dim text-xs">Ambient soundtrack</p>
              </div>
              <button
                onClick={() => updateSettings({ musicEnabled: !settings.musicEnabled })}
                aria-pressed={settings.musicEnabled}
                aria-label={settings.musicEnabled ? 'Turn background music off' : 'Turn background music on'}
                className={`w-12 h-6 rounded-full transition-all ${settings.musicEnabled ? 'bg-cyan-glow' : 'bg-white/10'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.musicEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Gameplay */}
        <GlassCard className="mb-4">
          <h3 className="section-title text-white mb-4 flex items-center gap-2">
            <Zap size={20} className="text-warning" />
            Gameplay
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-white text-sm mb-2">Animation Speed</p>
              <div className="flex gap-2">
                {(['slow', 'normal', 'fast'] as const).map((speed) => (
                  <button
                    key={speed}
                    onClick={() => updateSettings({ animationSpeed: speed })}
                    className={`flex-1 py-2 rounded-lg text-sm font-rajdhani font-semibold uppercase transition-all ${
                      settings.animationSpeed === speed
                        ? 'bg-cyan-glow/20 text-cyan-glow border border-cyan-glow/50'
                        : 'bg-white/5 text-text-secondary border border-transparent hover:bg-white/10'
                    }`}
                  >
                    {speed}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm">Auto-Save</p>
                <p className="text-text-dim text-xs">Save automatically each turn</p>
              </div>
              <button
                onClick={() => updateSettings({ autoSave: !settings.autoSave })}
                aria-pressed={settings.autoSave}
                aria-label={settings.autoSave ? 'Turn auto-save off' : 'Turn auto-save on'}
                className={`w-12 h-6 rounded-full transition-all ${settings.autoSave ? 'bg-cyan-glow' : 'bg-white/10'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.autoSave ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm">Guided Onboarding</p>
                <p className="text-text-dim text-xs">Keep beginner-first flow, glossary primer, and gate on early dashboards.</p>
              </div>
              <button
                onClick={() => updateSettings({ guidedMode: !settings.guidedMode })}
                aria-pressed={settings.guidedMode}
                aria-label={settings.guidedMode ? 'Turn guided onboarding off' : 'Turn guided onboarding on'}
                className={`w-12 h-6 rounded-full transition-all ${settings.guidedMode ? 'bg-cyan-glow' : 'bg-white/10'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.guidedMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {!settings.guidedMode && (
              <button
                type="button"
                onClick={() => updateSettings({ guidedMode: true })}
                className="flex w-full items-center gap-3 rounded-2xl border border-cyan-glow/25 bg-cyan-glow/10 p-3 text-left transition-colors hover:border-cyan-glow/50 hover:bg-cyan-glow/15"
              >
                <Sparkles size={17} className="shrink-0 text-cyan-glow" />
                <span>
                  <span className="block text-sm font-rajdhani font-semibold uppercase tracking-wider text-white">Restore guided help</span>
                  <span className="block text-xs text-text-secondary">Bring back beginner prompts on the dashboard without restarting the run.</span>
                </span>
              </button>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm">Less Text View</p>
                <p className="text-text-dim text-xs">Hide explanations for faster repeat runs. Keep this off while learning.</p>
              </div>
              <button
                onClick={() => updateSettings({ compactMode: !settings.compactMode })}
                aria-pressed={settings.compactMode}
                aria-label={settings.compactMode ? 'Turn off Less Text View and show full guide text' : 'Turn on Less Text View'}
                className={`w-12 h-6 rounded-full transition-all ${settings.compactMode ? 'bg-cyan-glow' : 'bg-white/10'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.compactMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {settings.compactMode && (
              <button
                type="button"
                onClick={() => updateSettings({ compactMode: false })}
                className="flex w-full items-center gap-3 rounded-2xl border border-success/25 bg-success/10 p-3 text-left transition-colors hover:border-success/50 hover:bg-success/15"
              >
                <Sparkles size={17} className="shrink-0 text-success" />
                <span>
                  <span className="block text-sm font-rajdhani font-semibold uppercase tracking-wider text-white">Show full guide text</span>
                  <span className="block text-xs text-text-secondary">Restore card explanations and beginner copy immediately.</span>
                </span>
              </button>
            )}
          </div>
        </GlassCard>

        {/* Accessibility */}
        <GlassCard className="mb-4" accentColor="#00E676">
          <h3 className="section-title text-white mb-4 flex items-center gap-2">
            <Type size={20} className="text-success" />
            Accessibility
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-white text-sm">Large Text Mode</p>
                <p className="text-text-dim text-xs">Bigger type and touch targets for senior and mobile play</p>
              </div>
              <button
                onClick={() => updateSettings({ largeTextMode: !settings.largeTextMode })}
                aria-pressed={settings.largeTextMode}
                aria-label={settings.largeTextMode ? 'Turn large text mode off' : 'Turn large text mode on'}
                className={`w-12 h-6 rounded-full transition-all ${settings.largeTextMode ? 'bg-success' : 'bg-white/10'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.largeTextMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-white text-sm">Light High-Contrast Mode</p>
                <p className="text-text-dim text-xs">Brighter surface for older eyes and outdoor phone use</p>
              </div>
              <button
                onClick={() => updateSettings({ highContrastMode: !settings.highContrastMode })}
                aria-pressed={settings.highContrastMode}
                aria-label={settings.highContrastMode ? 'Turn high contrast mode off' : 'Turn high contrast mode on'}
                className={`w-12 h-6 rounded-full transition-all ${settings.highContrastMode ? 'bg-success' : 'bg-white/10'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.highContrastMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="rounded-xl border border-success/20 bg-success/10 p-3">
              <div className="flex items-start gap-2">
                <SunMedium size={16} className="mt-0.5 text-success" />
                <p className="text-xs leading-relaxed text-text-secondary">
                  These modes retain the same game systems while reducing the cockpit feeling reported by older and mobile-first playtesters.
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Difficulty Info */}
        {isGameActive && (
          <GlassCard className="mb-4" accentColor="#FF9100">
            <h3 className="section-title text-white mb-4">Current Game</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Player</span>
                <span className="text-white font-mono">{player.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Difficulty</span>
                <span className="text-warning font-rajdhani font-semibold capitalize">{player.difficulty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Career</span>
                <span className="text-white font-mono">{player.careerId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Turns Played</span>
                <span className="text-white font-mono">{player.turnCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Target Net Worth</span>
                <span className="text-cyan-glow font-mono">S${(difficultySettings[player.difficulty].targetNetWorth / 1000000).toFixed(0)}M</span>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Reset */}
        <GlassCard>
          <h3 className="section-title text-white mb-4 flex items-center gap-2">
            <RotateCcw size={20} className="text-danger" />
            Danger Zone
          </h3>
          <button
            onClick={() => {
              if (confirm('This will erase all save data. Are you sure?')) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="btn-danger w-full"
          >
            Reset All Data
          </button>
        </GlassCard>
      </div>
    </div>
  );
}
