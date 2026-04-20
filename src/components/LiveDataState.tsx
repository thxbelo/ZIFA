import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveDataStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'default' | 'warning' | 'muted';
  loading?: boolean;
  compact?: boolean;
}

const toneStyles = {
  default: {
    panel: 'border-zifa-green/15 bg-zifa-green/[0.03]',
    iconWrap: 'bg-zifa-green/10 text-zifa-green',
    action: 'bg-zifa-green text-white hover:bg-green-800',
  },
  warning: {
    panel: 'border-zifa-yellow/40 bg-zifa-yellow/[0.08]',
    iconWrap: 'bg-zifa-yellow/20 text-yellow-700',
    action: 'bg-zifa-yellow text-zifa-black hover:bg-yellow-400',
  },
  muted: {
    panel: 'border-gray-200 bg-gray-50',
    iconWrap: 'bg-white text-gray-500 border border-gray-200',
    action: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100',
  },
};

export default function LiveDataState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  tone = 'default',
  loading = false,
  compact = false,
}: LiveDataStateProps) {
  const styles = toneStyles[tone];

  return (
    <div
      className={cn(
        'rounded-2xl border border-dashed px-6 text-center',
        compact ? 'py-10' : 'py-14',
        styles.panel
      )}
    >
      <div
        className={cn(
          'mx-auto mb-4 flex items-center justify-center rounded-2xl shadow-sm',
          compact ? 'h-14 w-14' : 'h-16 w-16',
          styles.iconWrap
        )}
      >
        {loading ? <Loader2 className="h-7 w-7 animate-spin" /> : <Icon className="h-7 w-7" />}
      </div>
      <h3 className="text-lg font-black tracking-tight text-gray-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-gray-500">{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className={cn(
            'mt-5 rounded-xl px-4 py-2 text-sm font-bold transition-colors',
            styles.action
          )}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
