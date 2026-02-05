import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from 'framer-motion';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  const colorMap = {
    success: 'bg-green-500 text-white border border-green-600',
    error: 'bg-red-500 text-white border border-red-600',
    destructive: 'bg-red-500 text-white border border-red-600',
    warning: 'bg-yellow-500 text-white border border-yellow-600',
    info: 'bg-blue-500 text-white border border-blue-600',
    default: 'bg-gray-800 text-white'
  };

  const IconMap = {
    success: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    error: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    destructive: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    info: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    warning: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
    default: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-auto">
      <AnimatePresence>
        {toasts.filter(t => t.open !== false).map(({ id, title, description, variant, ...props }) => {
          const type = variant || 'default';
          const ToastIcon = IconMap[type] || IconMap.default;
          const colorClass = colorMap[type] || colorMap.default;

          return (
            <motion.div
              key={id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.3 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.5 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`rounded-xl shadow-lg p-4 min-w-80 max-w-md ${colorClass}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <ToastIcon />
                </div>
                <div className="flex-1">
                  {title && <p className="font-medium text-sm">{title}</p>}
                  {description && <p className="text-xs opacity-90 mt-1">{description}</p>}
                </div>
                <button onClick={() => dismiss(id)} className="p-1 rounded-full hover:bg-white/20 -mt-1 -mr-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
} 