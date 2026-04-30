import { useGameStore } from '@/game/useGameStore';
import { properties } from '@/data/properties';
import GlassCard from '@/components/GlassCard';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Building2, ArrowRight, Newspaper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { player, nextTurn, market } = useGameStore();
  const navigate = useNavigate();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const netWorth = player.cash + player.properties.reduce((sum, p) => sum + p.currentValue, 0) + player.cpfOrdinary + player.cpfSpecial;
  const monthlyIncome = player.salary * 0.8 + player.properties.filter(p => p.isRented).reduce((sum, p) => sum + p.monthlyRental, 0);
  const monthlyExpenses = player.loans.filter(l => !l.isPaid).reduce((sum, l) => sum + l.monthlyPayment, 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
  };

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-deep-space pb-8 px-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-6xl mx-auto"
      >
        {/* Welcome Header */}
        <motion.div variants={itemVariants} className="mb-6">
          <h1 className="page-title text-white">Welcome, {player.name}</h1>
          <p className="text-text-secondary mt-1 font-rajdhani">
            {monthNames[player.month - 1]} {player.year} | Turn {player.turnCount} | Age {player.age}
          </p>
        </motion.div>

        {/* Key Metrics Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Wallet} label="Cash" value={`S$${(player.cash / 1000).toFixed(1)}K`} color="#00F0FF" change={undefined} />
          <StatCard icon={TrendingUp} label="Net Worth" value={`S$${(netWorth / 1000000).toFixed(2)}M`} color="#00E676" change={undefined} />
          <StatCard icon={Building2} label="Properties" value={String(player.properties.length)} color="#7C4DFF" change={undefined} />
          <StatCard icon={Newspaper} label="Market Index" value={`${market.priceIndex.toFixed(1)}`} color="#FF9100" change={market.lastEvent === 'boom' ? '+5.2%' : market.lastEvent === 'crash' ? '-3.1%' : '+0.8%'} />
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Monthly Cashflow */}
          <motion.div variants={itemVariants}>
            <GlassCard>
              <h3 className="section-title text-white mb-4">Monthly Cashflow</h3>
              <div className="space-y-3">
                <CashflowRow label="Salary (after CPF)" value={player.salary * 0.8} type="income" />
                <CashflowRow label="Rental Income" value={monthlyIncome - player.salary * 0.8} type="income" />
                <div className="border-t border-divider" />
                <CashflowRow label="Loan Payments" value={monthlyExpenses} type="expense" />
                <div className="border-t border-divider" />
                <CashflowRow label="Net Cashflow" value={monthlyIncome - monthlyExpenses} type={monthlyIncome - monthlyExpenses >= 0 ? 'income' : 'expense'} isTotal />
              </div>
            </GlassCard>
          </motion.div>

          {/* Portfolio Summary */}
          <motion.div variants={itemVariants}>
            <GlassCard>
              <h3 className="section-title text-white mb-4">Portfolio</h3>
              {player.properties.length === 0 ? (
                <div className="text-center py-6">
                  <Building2 size={32} className="text-text-dim mx-auto mb-2" />
                  <p className="text-text-secondary text-sm">No properties yet. Visit the Properties page to start investing!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {player.properties.slice(0, 5).map((p, i) => {
                    const propInfo = properties.find(prop => prop.id === p.propertyId);
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 border-b border-divider last:border-0 cursor-pointer hover:bg-white/5 rounded px-2 -mx-2 transition-colors"
                        onClick={() => propInfo && navigate(`/property/${propInfo.id}`)}
                      >
                        <div>
                          <p className="text-white text-sm font-medium hover:text-cyan-glow transition-colors">
                            {propInfo ? propInfo.name : `Property #${i + 1}`}
                          </p>
                          <p className="text-text-dim text-xs">Purchased: {p.purchaseDate}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-cyan-glow font-mono text-sm">S${(p.currentValue / 1000).toFixed(0)}K</p>
                          <p className={`text-[10px] ${p.isRented ? 'text-cyan-glow' : 'text-text-dim'}`}>{p.isRented ? 'Rented' : 'Vacant'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="space-y-4">
            <GlassCard accentColor="#00F0FF">
              <h3 className="section-title text-white mb-4">Actions</h3>
              <div className="space-y-2">
                <button onClick={() => window.location.hash = '#/properties'} className="w-full btn-secondary text-sm py-3">
                  Browse Properties
                </button>
                <button onClick={() => window.location.hash = '#/bank'} className="w-full btn-secondary text-sm py-3">
                  Manage Loans
                </button>
                <button onClick={() => window.location.hash = '#/market'} className="w-full btn-secondary text-sm py-3">
                  Market Overview
                </button>
              </div>
            </GlassCard>

            {/* Next Turn */}
            <GlassCard accentColor="#00E676">
              <h3 className="section-title text-white mb-2">Next Turn</h3>
              <p className="text-text-secondary text-xs mb-4">Advance one month. Collect rent, pay loans, and trigger market changes.</p>
              <button
                onClick={nextTurn}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Advance to {monthNames[player.month % 12]} {player.month === 12 ? player.year + 1 : player.year}
                <ArrowRight size={16} />
              </button>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, change }: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  change?: string;
}) {
  return (
    <GlassCard className="relative overflow-hidden">
      <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }} />
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} style={{ color }} />
        <span className="label-text text-text-dim text-[10px]">{label}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="font-mono text-xl font-bold text-white">{value}</span>
        {change && (
          <span className={`text-[10px] font-mono mb-1 ${change.startsWith('+') ? 'text-success' : 'text-danger'}`}>
            {change}
          </span>
        )}
      </div>
    </GlassCard>
  );
}

function CashflowRow({ label, value, type, isTotal }: {
  label: string;
  value: number;
  type: 'income' | 'expense';
  isTotal?: boolean;
}) {
  const color = isTotal
    ? (value >= 0 ? '#00E676' : '#FF1744')
    : type === 'income' ? '#00E676' : '#FF1744';

  return (
    <div className="flex items-center justify-between">
      <span className={`${isTotal ? 'text-white font-semibold' : 'text-text-secondary'} text-sm`}>{label}</span>
      <span className="font-mono text-sm" style={{ color }}>
        {type === 'expense' && !isTotal ? '-' : ''}{isTotal && value >= 0 ? '+' : ''}S${Math.abs(value).toLocaleString()}
      </span>
    </div>
  );
}
