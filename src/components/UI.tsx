import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ message = 'Chargement...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-8 h-8 text-[#FFD400] animate-spin mb-3" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="font-bold text-lg text-[#080808] mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 bg-[#FFD400] text-[#080808] font-bold rounded-lg hover:bg-yellow-300 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'yellow' | 'dark' }) {
  const styles = {
    default: 'bg-gray-100 text-gray-700',
    yellow: 'bg-[#FFD400] text-[#080808]',
    dark: 'bg-[#080808] text-[#FFD400]',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}
