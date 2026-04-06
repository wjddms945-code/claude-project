import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function Toast({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  const bg: Record<ToastType, string> = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  };
  const icon: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastBubble
          key={toast.id}
          toast={toast}
          bg={bg[toast.type]}
          iconChar={icon[toast.type]}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

function ToastBubble({
  toast,
  bg,
  iconChar,
  onDismiss,
}: {
  toast: ToastItem;
  bg: string;
  iconChar: string;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // mount animation
    const show = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(show);
  }, []);

  return (
    <div
      className={`${bg} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[220px] max-w-xs pointer-events-auto
        transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-white/20 text-sm font-bold">
        {iconChar}
      </span>
      <span className="text-sm flex-1 leading-snug">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-white/70 hover:text-white text-lg leading-none ml-1"
        aria-label="닫기"
      >
        ×
      </button>
    </div>
  );
}

// ──────────────────────────────
// Hook for managing toast state
// ──────────────────────────────
export function useToast(autoDismissMs = 3000) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const show = (message: string, type: ToastType = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (autoDismissMs > 0) {
      setTimeout(() => dismiss(id), autoDismissMs);
    }
    return id;
  };

  return { toasts, show, dismiss };
}
