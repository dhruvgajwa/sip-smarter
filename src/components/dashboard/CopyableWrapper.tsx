import { useState, ReactNode } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CopyableWrapperProps {
  children: ReactNode;
  data: unknown;
  label?: string;
  className?: string;
}

/**
 * Wraps any component and provides a copy-to-clipboard button
 * Serializes the data as formatted JSON or CSV depending on structure
 */
export function CopyableWrapper({ children, data, label = 'Data', className = '' }: CopyableWrapperProps) {
  const [copied, setCopied] = useState(false);

  const formatForClipboard = (data: unknown): string => {
    // If it's an array of objects, format as TSV (tab-separated values) for easy Excel paste
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
      const headers = Object.keys(data[0] as object);
      const rows = data.map((row) =>
        headers.map((h) => {
          const val = (row as Record<string, unknown>)[h];
          return typeof val === 'number' ? val.toFixed(4) : String(val ?? '');
        }).join('\t')
      );
      return [headers.join('\t'), ...rows].join('\n');
    }
    // Otherwise, format as JSON
    return JSON.stringify(data, null, 2);
  };

  const handleCopy = async () => {
    try {
      const text = formatForClipboard(data);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className={`relative group ${className}`}>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title={`Copy ${label}`}
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-500" />
        ) : (
          <Copy className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
      {children}
    </div>
  );
}
