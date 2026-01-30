import { useState, useCallback, useRef } from 'react';
import type { ConsoleLine } from '@/types/mutualFund';

export function useConsoleLog() {
  const [logs, setLogs] = useState<ConsoleLine[]>([]);
  const idCounter = useRef(0);

  const log = useCallback((message: string, type: ConsoleLine['type'] = 'info') => {
    const newLog: ConsoleLine = {
      id: `log-${++idCounter.current}`,
      timestamp: new Date(),
      message,
      type,
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  const clear = useCallback(() => {
    setLogs([]);
  }, []);

  return { logs, log, clear };
}
