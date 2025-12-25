import React, { createContext, useContext, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const addToast = (toast) => {
    const id = Date.now(); // Changed id generation
    setToasts((prev) => [{ ...toast, id }, ...prev]); // Prepends new toast
    setTimeout(() => removeToast(id), toast.duration || 5000); // Fixed duration, also allow custom duration
  };

  const toast = useMemo(() => {
    const fn = (options) => {
      if (typeof options === 'string') {
        addToast({ type: 'info', title: options, message: options });
      } else if (options && options.title) {
        const type = options.variant === 'destructive'
          ? 'error'
          : (options.variant === 'success' ? 'success' : (options.variant || 'info'));

        addToast({
          type: type,
          title: options.title,
          message: options.title,
          description: options.description,
          ...options
        });
      }
    };

    fn.success = (options) => fn({ ...options, variant: 'success' });
    fn.error = (options) => fn({ ...options, variant: 'destructive' });
    fn.info = (options) => fn({ ...options, variant: 'info' });
    fn.warning = (options) => fn({ ...options, variant: 'warning' });

    return fn;
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} removeToast={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Export stub components for compatibility
export const ToastTitle = ({ children }) => <div className="font-medium">{children}</div>;
export const ToastDescription = ({ children }) => <div className="text-sm opacity-90">{children}</div>;
export const ToastViewport = ({ children }) => <div>{children}</div>;
export const ToastAction = ({ children, ...props }) => <button {...props}>{children}</button>;
export const ToastClose = ({ children, ...props }) => <button {...props}>{children}</button>;

export function Toast({ toast, removeToast }) {
  const colorMap = {
    success: 'bg-green-500 text-white border border-green-600',
    error: 'bg-red-500 text-white border border-red-600',
    warning: 'bg-yellow-500 text-white border border-yellow-600',
    info: 'bg-blue-500 text-white border border-blue-600'
  };

  const IconMap = {
    success: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    error: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    info: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    warning: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  }

  const ToastIcon = IconMap[toast.type] || IconMap.info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.5 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`rounded-xl shadow-lg p-4 min-w-80 max-w-md ${colorMap[toast.type] || 'bg-gray-800 text-white'}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <ToastIcon />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">{toast.message}</p>
          {toast.description && <p className="text-xs opacity-90 mt-1">{toast.description}</p>}
        </div>
        <button onClick={() => removeToast(toast.id)} className="p-1 rounded-full hover:bg-white/20 -mt-1 -mr-1">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </motion.div>
  );
}