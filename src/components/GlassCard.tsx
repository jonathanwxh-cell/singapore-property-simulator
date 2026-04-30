import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  accentColor?: string;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function GlassCard({
  children,
  accentColor,
  className,
  onClick,
  hoverable = false,
  padding = 'md',
}: GlassCardProps) {
  const paddingMap = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div
      className={cn(
        'relative rounded-card border border-glass-border bg-glass-fill backdrop-blur-xl',
        'shadow-glass transition-all duration-300',
        hoverable && 'cursor-pointer hover:border-white/15 hover:shadow-glass-hover',
        onClick && 'cursor-pointer',
        paddingMap[padding],
        className,
      )}
      onClick={onClick}
      style={accentColor ? {
        borderTop: `2px solid ${accentColor}`,
      } : undefined}
    >
      {accentColor && (
        <div
          className="absolute top-0 left-4 right-4 h-[2px] rounded-full opacity-80"
          style={{ backgroundColor: accentColor, boxShadow: `0 0 12px ${accentColor}` }}
        />
      )}
      {children}
    </div>
  );
}
