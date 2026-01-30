import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { ConsoleLine } from '@/types/mutualFund';
import { format } from 'date-fns';

interface ConsolePanelProps {
  logs: ConsoleLine[];
  onClear: () => void;
}

export function ConsolePanel({ logs, onClear }: ConsolePanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  const getLogColor = (type: ConsoleLine['type']) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-t border-border bg-card">
      <div className="flex items-center justify-between px-4 py-2">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            Console Output ({logs.length})
          </Button>
        </CollapsibleTrigger>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
      </div>
      <CollapsibleContent>
        <ScrollArea className="h-40 bg-muted/30">
          <div className="p-4 font-mono text-xs space-y-1">
            {logs.length === 0 ? (
              <span className="text-muted-foreground">No logs yet...</span>
            ) : (
              logs.map(log => (
                <div key={log.id} className="flex gap-2">
                  <span className="text-muted-foreground/60">
                    [{format(log.timestamp, 'HH:mm:ss')}]
                  </span>
                  <span className={getLogColor(log.type)}>{log.message}</span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
}
