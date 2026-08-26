import { useState, useCallback, useRef, useEffect } from 'react';

interface Toast {
  message:  string;
  type:     'success' | 'error' | 'info';
}

export function useToast(duration = 3000) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const show = useCallback(
    (message: string, type: Toast['type'] = 'success') => {
      clearTimer();
      setToast({ message, type });
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setToast(null);
      }, duration);
    },
    [duration]
  );

  const success = useCallback((msg: string) => show(msg, 'success'), [show]);
  const error   = useCallback((msg: string) => show(msg, 'error'),   [show]);
  const info    = useCallback((msg: string) => show(msg, 'info'),    [show]);

  const dismiss = useCallback(() => {
    clearTimer();
    setToast(null);
  }, []);

  useEffect(() => clearTimer, []);

  return { toast, show, success, error, info, dismiss };
}
