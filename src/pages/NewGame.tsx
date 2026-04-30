import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/game/useGameStore';
import { careers } from '@/data/careers';
import { difficultySettings } from '@/game/types';
import type { Difficulty } from '@/game/types';
import GlassCard from '@/components/GlassCard';
import { ArrowLeft, ArrowRight, User, GraduationCap, TrendingUp, Cpu, Rocket, Shield, Heart, Home } from 'lucide-react';

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

  const handleStart = () => {
    if (!name.trim()) return;
    newGame(name.trim(), careerId, difficulty);
    navigate('/dashboard');
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
            {[0, 1, 2].map(s => (
              <div key={s} className={`h-1 rounded-full transition-all ${s === step ? 'w-8 bg-cyan-glow' : 'w-4 bg-text-dim/30'}`} />
            ))}
          </div>
        </div>

        {/* Step 1: Name */}
        {step === 0 && (
          <div className="flex flex-col flex-1">
            <h2 className="section-title text-cyan-glow text-center text-lg mb-4 shrink-0">Enter Your Name</h2>
            <div className="flex-1 flex items-start justify-center pt-8">
              <GlassCard className="max-w-md w-full">
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
            </div>
            <div className="shrink-0 pb-4">
              <button
                onClick={() => name.trim() && setStep(1)}
                disabled={!name.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
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

        {/* Step 3: Difficulty */}
        {step === 2 && (
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
