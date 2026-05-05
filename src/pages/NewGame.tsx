import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/game/useGameStore';
import { careers } from '@/data/careers';
import { runRoutes } from '@/data/runRoutes';
import { difficultySettings } from '@/game/types';
import type { BuyerProfile, BuyerResidencyStatus, Difficulty, HouseholdProfile, RunRouteId } from '@/game/types';
import GlassCard from '@/components/GlassCard';
import GlossaryTerm from '@/components/GlossaryTerm';
import { ArrowLeft, ArrowRight, User, GraduationCap, TrendingUp, Cpu, Rocket, Shield, Heart, Home, Users, Globe2, Compass, BookOpen } from 'lucide-react';

const careerIcons: Record<string, React.ElementType> = {
  graduate: GraduationCap,
  banking: TrendingUp,
  tech: Cpu,
  entrepreneur: Rocket,
  civil: Shield,
  medical: Heart,
  agent: Home,
};

export default function NewGame() {
  const navigate = useNavigate();
  const newGame = useGameStore(s => s.newGame);
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [careerId, setCareerId] = useState('graduate');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [runRouteId, setRunRouteId] = useState<RunRouteId>('bto-upgrader');
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfile>({
    residencyStatus: 'sc',
    householdProfile: 'couple-family',
    age: 30,
  });

  const handleStart = () => {
    if (!name.trim()) return;
    newGame(name.trim(), careerId, difficulty, buyerProfile, runRouteId);
    navigate('/dashboard');
  };

  const handleGuidedStart = () => {
    newGame(
      name.trim() || 'Rookie Investor',
      'graduate',
      'normal',
      { residencyStatus: 'sc', householdProfile: 'couple-family', age: 30 },
      'bto-upgrader',
    );
    navigate('/dashboard');
  };

  const applyBuyerProfile = (profile: BuyerProfile) => {
    setBuyerProfile(profile);
    setRunRouteId(recommendRunRoute(profile));
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-deep-space px-4 flex flex-col pt-8">
      <div className="max-w-2xl mx-auto w-full flex flex-col h-full">
        {/* Header */}
        <div className="shrink-0 mb-4">
          <button
            onClick={() => step === 0 ? navigate('/') : setStep(step - 1)}
            className="flex items-center gap-2 text-text-secondary hover:text-cyan-glow transition-colors mb-4"
          >
            <ArrowLeft size={18} />
            <span className="font-rajdhani text-sm uppercase tracking-wider">Back</span>
          </button>

          <h1 className="page-title text-white text-center text-2xl mb-2">New Game</h1>
          <div className="flex justify-center gap-2 mb-2">
            {[0, 1, 2, 3, 4].map(s => (
              <div key={s} className={`h-1 rounded-full transition-all ${s === step ? 'w-8 bg-cyan-glow' : 'w-4 bg-text-dim/30'}`} />
            ))}
          </div>
        </div>

        {/* Step 1: Name */}
        {step === 0 && (
          <div className="flex flex-col flex-1">
            <h2 className="section-title text-cyan-glow text-center text-lg mb-4 shrink-0">Enter Your Name</h2>
            <div className="flex-1 flex items-start justify-center pt-8">
              <div className="max-w-md w-full space-y-4">
                <GlassCard>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-void-navy border-2 border-cyan-glow/30 flex items-center justify-center">
                      <User size={28} className="text-cyan-glow" />
                    </div>
                    <div className="flex-1">
                      <label className="label-text text-text-dim text-xs block mb-2">Player Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name..."
                        className="w-full bg-void-navy border border-glass-border rounded-input px-4 py-3 text-white font-mono placeholder:text-text-dim/50 focus:border-cyan-glow focus:outline-none transition-colors"
                        maxLength={20}
                        autoFocus
                      />
                    </div>
                  </div>
                </GlassCard>

                <GlassCard accentColor="#FFD740">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-warning/10 border border-warning/30 flex items-center justify-center shrink-0">
                      <BookOpen size={18} className="text-warning" />
                    </div>
                    <div>
                      <p className="font-rajdhani text-white font-semibold uppercase tracking-[0.12em] text-sm">Beginner Friendly</p>
                      <p className="text-text-secondary text-xs mt-1 leading-relaxed">
                        You do not need to know Singapore property terms. The game will teach <GlossaryTerm termId="absd" />, <GlossaryTerm termId="cpf-oa" />, and <GlossaryTerm termId="mop" /> as you play.
                      </p>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <button type="button" onClick={() => navigate('/learn')} className="btn-secondary text-xs py-2 px-3">
                          Preview Learn Hub
                        </button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
            <div className="shrink-0 pb-4">
              <button
                onClick={handleGuidedStart}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Start Recommended Run
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => name.trim() && setStep(1)}
                disabled={!name.trim()}
                className="btn-secondary w-full mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Customize Run
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Career */}
        {step === 1 && (
          <div className="flex flex-col h-full min-h-0">
            <h2 className="section-title text-cyan-glow text-center text-lg mb-3 shrink-0">Choose Your Career</h2>
            <div className="flex-1 overflow-y-auto min-h-0 mb-4 pr-1 space-y-2">
              {careers.map((career) => {
                const Icon = careerIcons[career.id] || User;
                const isSelected = careerId === career.id;
                return (
                  <button
                    key={career.id}
                    onClick={() => setCareerId(career.id)}
                    className={`glass-card p-3 text-left transition-all w-full ${isSelected ? 'border-cyan-glow/50 bg-cyan-glow/5' : 'hover:bg-white/5'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${career.color}20`, color: career.color }}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-rajdhani font-semibold text-white text-sm">{career.name}</h3>
                          <span className="text-[10px] font-mono text-cyan-glow">S${career.startingSalary.toLocaleString()}/mo</span>
                        </div>
                        <p className="text-text-secondary text-[11px] mt-0.5 line-clamp-1">{career.description}</p>
                        <div className="flex gap-3 mt-1 text-[10px] font-mono">
                          <span style={{ color: career.color }}>Growth: {(career.growthRate * 100).toFixed(0)}%</span>
                          <span className="text-text-dim">Risk: {(career.riskFactor * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="shrink-0 pb-4">
              <button onClick={() => setStep(2)} className="btn-primary w-full">
                Next
                <ArrowRight size={16} className="inline ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Buyer Profile */}
        {step === 2 && (
          <div className="flex flex-col h-full min-h-0">
            <h2 className="section-title text-cyan-glow text-center text-lg mb-3 shrink-0">Choose Buyer Profile</h2>
            <div className="flex-1 overflow-y-auto min-h-0 mb-4 pr-1 space-y-4">
              <GlassCard>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-glow/10 border border-cyan-glow/30 flex items-center justify-center shrink-0">
                    <Users size={18} className="text-cyan-glow" />
                  </div>
                  <div>
                    <h3 className="font-rajdhani text-white font-semibold uppercase tracking-[0.12em] text-sm">Household Setup</h3>
                    <p className="text-text-secondary text-xs mt-1">This changes HDB/EC access, age assumptions, and how the first-home ladder feels.</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {householdOptions.map((option) => {
                    const isSelected = buyerProfile.householdProfile === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => applyBuyerProfile({
                          ...buyerProfile,
                          householdProfile: option.value,
                          residencyStatus: option.defaultResidency ?? buyerProfile.residencyStatus,
                          age: option.defaultAge ?? buyerProfile.age,
                        })}
                        className={`rounded-xl border p-3 text-left transition-all ${isSelected ? 'border-cyan-glow/60 bg-cyan-glow/10' : 'border-glass-border bg-white/[0.03] hover:border-cyan-glow/40'}`}
                      >
                        <p className="text-white text-sm font-semibold">{option.label}</p>
                        <p className="text-text-secondary text-xs mt-1 leading-relaxed">{option.hint}</p>
                      </button>
                    );
                  })}
                </div>
              </GlassCard>

              <GlassCard>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-success/10 border border-success/30 flex items-center justify-center shrink-0">
                    <Globe2 size={18} className="text-success" />
                  </div>
                  <div>
                    <h3 className="font-rajdhani text-white font-semibold uppercase tracking-[0.12em] text-sm">Residency & Duties</h3>
                    <p className="text-text-secondary text-xs mt-1"><GlossaryTerm termId="absd" /> and public-housing access now follow your selected simplified buyer profile.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {residencyOptions.map((option) => {
                    const isSelected = buyerProfile.residencyStatus === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => applyBuyerProfile({ ...buyerProfile, residencyStatus: option.value })}
                        className={`w-full rounded-xl border p-3 text-left transition-all ${isSelected ? 'border-success/60 bg-success/10' : 'border-glass-border bg-white/[0.03] hover:border-success/40'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-white text-sm font-semibold">{option.label}</p>
                          <span className="font-mono text-[10px] text-success">{option.rateLabel}</span>
                        </div>
                        <p className="text-text-secondary text-xs mt-1 leading-relaxed">{option.hint}</p>
                      </button>
                    );
                  })}
                </div>
              </GlassCard>

              <GlassCard>
                <label className="label-text text-text-dim text-xs block mb-2">Starting Age</label>
                <select
                  value={buyerProfile.age}
                  onChange={(event) => setBuyerProfile((profile) => ({ ...profile, age: Number(event.target.value) }))}
                  className="w-full bg-void-navy border border-glass-border rounded-input px-4 py-3 text-white font-mono focus:border-cyan-glow focus:outline-none transition-colors"
                >
                  {getAgeOptions(buyerProfile.householdProfile).map((age) => (
                    <option key={age} value={age}>{age}</option>
                  ))}
                </select>
                <p className="text-text-dim text-xs mt-2">Age affects CPF starting balances and whether the single-buyer HDB path is unlocked.</p>
              </GlassCard>
            </div>
            <div className="shrink-0 pb-4">
              <button onClick={() => setStep(3)} className="btn-primary w-full">
                Next
                <ArrowRight size={16} className="inline ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Life Arc */}
        {step === 3 && (
          <div className="flex flex-col h-full min-h-0">
            <h2 className="section-title text-cyan-glow text-center text-lg mb-3 shrink-0">Choose Your Life Arc</h2>
            <div className="flex-1 overflow-y-auto min-h-0 mb-4 pr-1 space-y-2">
              {runRoutes.map((route) => {
                const isSelected = runRouteId === route.id;
                const recommended =
                  route.recommendedBuyerProfiles.includes(buyerProfile.householdProfile)
                  && route.recommendedResidency.includes(buyerProfile.residencyStatus);
                return (
                  <button
                    key={route.id}
                    onClick={() => setRunRouteId(route.id)}
                    className={`glass-card p-3 text-left transition-all w-full ${isSelected ? 'border-cyan-glow/50 bg-cyan-glow/5' : 'hover:bg-white/5'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
                        style={{ borderColor: `${route.accentColor}66`, backgroundColor: `${route.accentColor}18`, color: route.accentColor }}
                      >
                        <Compass size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-rajdhani font-semibold text-white text-sm">{route.label}</h3>
                          {route.beginnerFriendly && <span className="rounded-full bg-success/15 px-2 py-0.5 text-[9px] font-mono text-success">BEGINNER</span>}
                          {recommended && <span className="rounded-full bg-cyan-glow/15 px-2 py-0.5 text-[9px] font-mono text-cyan-glow">RECOMMENDED</span>}
                        </div>
                        <p className="text-text-secondary text-xs mt-1 leading-relaxed">{route.tagline}</p>
                        <p className="text-text-dim text-[10px] mt-2">{route.difficultyHint} | Teaches: {route.primaryLessons.join(', ')}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="shrink-0 pb-4">
              <button onClick={() => setStep(4)} className="btn-primary w-full">
                Next
                <ArrowRight size={16} className="inline ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Difficulty */}
        {step === 4 && (
          <div className="flex flex-col h-full min-h-0">
            <h2 className="section-title text-cyan-glow text-center text-lg mb-3 shrink-0">Select Difficulty</h2>
            <div className="flex-1 overflow-y-auto min-h-0 mb-4 pr-1 space-y-2">
              {(Object.keys(difficultySettings) as Difficulty[]).map((diff) => {
                const settings = difficultySettings[diff];
                const isSelected = difficulty === diff;
                return (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`glass-card p-3 text-left transition-all w-full ${isSelected ? 'border-cyan-glow/50 bg-cyan-glow/5' : 'hover:bg-white/5'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-rajdhani font-semibold text-white text-sm capitalize">{settings.label}</h3>
                      <span className="text-xs font-mono text-cyan-glow">S${settings.startingCash.toLocaleString()}</span>
                    </div>
                    <p className="text-text-secondary text-xs">{settings.description}</p>
                    <div className="flex gap-4 mt-2 text-[10px] font-mono text-text-dim">
                      <span>Volatility: {(settings.marketVolatility * 100).toFixed(0)}%</span>
                      <span>Target: S${(settings.targetNetWorth / 1000000).toFixed(0)}M</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="shrink-0 pb-4">
              <button onClick={handleStart} className="btn-primary w-full">
                Start Game
                <ArrowRight size={16} className="inline ml-2" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const householdOptions: Array<{
  value: HouseholdProfile;
  label: string;
  hint: string;
  defaultAge?: number;
  defaultResidency?: BuyerResidencyStatus;
}> = [
  {
    value: 'couple-family',
    label: 'Couple / Family',
    hint: 'Best starter path for HDB BTO/resale, grants, and the classic first-home ladder.',
    defaultAge: 30,
  },
  {
    value: 'single-35-plus',
    label: 'Single 35+',
    hint: 'A tighter but realistic solo-buyer path where HDB access starts after age 35.',
    defaultAge: 35,
  },
  {
    value: 'single-under-35',
    label: 'Single Under 35',
    hint: 'Harder early game: private/rental-first decisions before subsidized HDB access opens.',
    defaultAge: 27,
  },
  {
    value: 'foreigner-investor',
    label: 'Foreign Investor',
    hint: 'Private and commercial focus with heavy ABSD and no simplified HDB/EC access.',
    defaultAge: 40,
    defaultResidency: 'foreigner',
  },
];

const residencyOptions: Array<{
  value: BuyerResidencyStatus;
  label: string;
  rateLabel: string;
  hint: string;
}> = [
  {
    value: 'sc',
    label: 'Singapore Citizen',
    rateLabel: '0% first-home ABSD',
    hint: 'Default learning route: first residential purchase has no ABSD, then cooling measures bite on upgrades.',
  },
  {
    value: 'spr',
    label: 'Singapore PR',
    rateLabel: '5% first-home ABSD',
    hint: 'Private/resale-oriented run with PR ABSD and a stricter simplified HDB BTO path.',
  },
  {
    value: 'foreigner',
    label: 'Foreigner',
    rateLabel: '60% ABSD',
    hint: 'High-friction investor route that steers away from subsidized housing and ECs.',
  },
];

function getAgeOptions(householdProfile: HouseholdProfile): number[] {
  if (householdProfile === 'single-under-35') return [27, 30, 34];
  if (householdProfile === 'single-35-plus') return [35, 40, 45];
  return [27, 30, 35, 40, 45];
}

function recommendRunRoute(profile: BuyerProfile): RunRouteId {
  if (profile.residencyStatus === 'foreigner' || profile.householdProfile === 'foreigner-investor') return 'foreign-investor';
  if (profile.residencyStatus === 'spr') return 'pr-private-climber';
  if (profile.householdProfile === 'single-35-plus') return 'single-resale';
  return 'bto-upgrader';
}
