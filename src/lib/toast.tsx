import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++nextId;
    setItems((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = (id: number) => setItems((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {items.map((item) => {
          const config = {
            success: { icon: CheckCircle2, bg: 'bg-green-600', iconColor: 'text-white' },
            error: { icon: AlertCircle, bg: 'bg-red-600', iconColor: 'text-white' },
            info: { icon: Info, bg: 'bg-[#080808]', iconColor: 'text-[#FFD400]' },
          }[item.type];
          const Icon = config.icon;
          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 ${config.bg} text-white rounded-xl shadow-lg px-4 py-3 animate-slide-in`}
            >
              <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0`} />
              <p className="text-sm font-medium flex-1">{item.message}</p>
              <button onClick={() => dismiss(item.id)} className="text-white/70 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
