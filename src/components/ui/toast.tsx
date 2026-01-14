"use client";

import { Toaster, toast } from "react-hot-toast";
import { 
  CheckCircle, XCircle, AlertTriangle, Info, 
  Loader2, X 
} from "lucide-react";

/**
 * Toast Provider Component
 * Add this to your root layout
 */
export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      containerStyle={{
        top: 80,
      }}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--toast-bg, #fff)',
          color: 'var(--toast-color, #1e293b)',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
          border: '1px solid var(--toast-border, #e2e8f0)',
          maxWidth: '400px',
        },
      }}
    />
  );
}

/**
 * Custom toast functions with beautiful styling
 */
export const showToast = {
  success: (message: string, description?: string) => {
    toast.custom((t) => (
      <div
        className={`
          flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-xl 
          border border-green-200 dark:border-green-800
          ${t.visible ? 'animate-enter' : 'animate-leave'}
        `}
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{message}</p>
          {description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
          )}
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <X className="h-4 w-4 text-slate-400" />
        </button>
      </div>
    ));
  },

  error: (message: string, description?: string) => {
    toast.custom((t) => (
      <div
        className={`
          flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-xl 
          border border-red-200 dark:border-red-800
          ${t.visible ? 'animate-enter' : 'animate-leave'}
        `}
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{message}</p>
          {description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
          )}
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <X className="h-4 w-4 text-slate-400" />
        </button>
      </div>
    ));
  },

  warning: (message: string, description?: string) => {
    toast.custom((t) => (
      <div
        className={`
          flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-xl 
          border border-amber-200 dark:border-amber-800
          ${t.visible ? 'animate-enter' : 'animate-leave'}
        `}
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{message}</p>
          {description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
          )}
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <X className="h-4 w-4 text-slate-400" />
        </button>
      </div>
    ));
  },

  info: (message: string, description?: string) => {
    toast.custom((t) => (
      <div
        className={`
          flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-xl 
          border border-blue-200 dark:border-blue-800
          ${t.visible ? 'animate-enter' : 'animate-leave'}
        `}
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{message}</p>
          {description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
          )}
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <X className="h-4 w-4 text-slate-400" />
        </button>
      </div>
    ));
  },

  loading: (message: string) => {
    return toast.custom((t) => (
      <div
        className={`
          flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-xl 
          border border-slate-200 dark:border-slate-700
          ${t.visible ? 'animate-enter' : 'animate-leave'}
        `}
      >
        <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
        <p className="text-sm font-medium text-slate-900 dark:text-white">{message}</p>
      </div>
    ), { duration: Infinity });
  },

  dismiss: (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages, {
      style: {
        minWidth: '250px',
      },
    });
  },
};

// Re-export original toast for advanced usage
export { toast };
