import { useState, ReactNode } from 'react';
import { ChevronDown, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CollapsibleBlockProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
  /** Data to copy when using the copy button */
  copyData?: unknown;
  /** Badge to show in the header */
  badge?: ReactNode;
  /** Compact mode reduces padding */
  compact?: boolean;
}

/**
 * A collapsible block component for organizing dashboard content.
 * Each block can be expanded/collapsed and optionally copied.
 */
export function CollapsibleBlock({
  title,
  subtitle,
  icon,
  defaultOpen = true,
  children,
  className,
  copyData,
  badge,
  compact = false,
}: CollapsibleBlockProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!copyData) return;

    try {
      const formatted = formatForClipboard(copyData);
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className={cn(
      'border border-border rounded-lg bg-card overflow-hidden',
      className
    )}>
      {/* Header - always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between text-left transition-colors hover:bg-muted/50',
          compact ? 'px-3 py-2' : 'px-4 py-3'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <span className="text-primary flex-shrink-0">{icon}</span>
          )}
          <div className="min-w-0">
            <h3 className={cn(
              'font-medium truncate',
              compact ? 'text-sm' : 'text-base'
            )}>
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {badge}
          {copyData && (
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-muted transition-colors"
              title="Copy data"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </button>

      {/* Content - collapsible */}
      {isOpen && (
        <div className={cn(
          'border-t border-border',
          compact ? 'p-3' : 'p-4'
        )}>
          {children}
        </div>
      )}
    </div>
  );
}

function formatForClipboard(data: unknown): string {
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
    const headers = Object.keys(data[0] as Record<string, unknown>);
    const rows = data.map(row => 
      headers.map(h => String((row as Record<string, unknown>)[h] ?? '')).join('\t')
    );
    return [headers.join('\t'), ...rows].join('\n');
  }
  return JSON.stringify(data, null, 2);
}
