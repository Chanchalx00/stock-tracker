import { useState, useCallback } from 'react';

interface Toast {
  message:  string;
  type:     'success' | 'error' | 'info';
}

export function useToast(duration = 3000) {
  const [toast, setToast] = useState<Toast | null>(null);

  const show = useCallback(
    (message: string, type: Toast['type'] = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), duration);
    },
    [duration]
  );

  const success = useCallback((msg: string) => show(msg, 'success'), [show]);
  const error   = useCallback((msg: string) => show(msg, 'error'),   [show]);
  const info    = useCallback((msg: string) => show(msg, 'info'),    [show]);
  const dismiss = useCallback(() => setToast(null), []);

  return { toast, show, success, error, info, dismiss };
}