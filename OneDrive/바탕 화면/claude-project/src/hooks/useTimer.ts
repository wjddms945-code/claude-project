import { useState, useEffect } from 'react';
import { formatTimerDisplay } from '../utils/timeUtils';

interface UseTimerResult {
  elapsedSeconds: number;
  formattedTime: string;
}

export function useTimer(startedAt: string | null, isRunning: boolean): UseTimerResult {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    if (!startedAt) return 0;
    return Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  });

  useEffect(() => {
    if (!isRunning || !startedAt) return;

    // Sync with actual start time on mount
    const syncElapsed = () => {
      const start = new Date(startedAt).getTime();
      setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    };

    syncElapsed();
    const interval = setInterval(syncElapsed, 1000);
    return () => clearInterval(interval);
  }, [isRunning, startedAt]);

  return {
    elapsedSeconds,
    formattedTime: formatTimerDisplay(elapsedSeconds),
  };
}
