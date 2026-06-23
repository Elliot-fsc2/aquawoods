import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle, AlertTriangle, Info, X, AlertCircle } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info" | "emergency";

interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastCtx {
  addToast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastCtx>({ addToast: () => {} });

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = nextId++;
    setToasts((t) => [...t, { id, type, title, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), type === "emergency" ? 8000 : 4000);
  }, []);

  const remove = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  const style: Record<ToastType, { bg: string; icon: ReactNode; border: string }> = {
    success: { bg: "bg-emerald-50", border: "border-emerald-300", icon: <CheckCircle className="w-5 h-5 text-emerald-600" /> },
    error: { bg: "bg-red-50", border: "border-red-300", icon: <AlertCircle className="w-5 h-5 text-red-600" /> },
    warning: { bg: "bg-amber-50", border: "border-amber-300", icon: <AlertTriangle className="w-5 h-5 text-amber-600" /> },
    info: { bg: "bg-blue-50", border: "border-blue-300", icon: <Info className="w-5 h-5 text-blue-600" /> },
    emergency: { bg: "bg-red-600", border: "border-red-800", icon: <AlertCircle className="w-5 h-5 text-white" /> },
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const s = style[t.type];
          const isEmergency = t.type === "emergency";
          return (
            <div
              key={t.id}
              className={`pointer-events-auto rounded-xl border shadow-lg p-4 flex items-start gap-3 animate-fade-up ${s.bg} ${s.border} ${isEmergency ? "animate-pulse" : ""}`}
            >
              <div className="flex-shrink-0 mt-0.5">{s.icon}</div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${isEmergency ? "text-white" : "text-brand-900"}`}>{t.title}</div>
                {t.message && <div className={`text-xs mt-0.5 ${isEmergency ? "text-red-100" : "text-brand-700"}`}>{t.message}</div>}
              </div>
              <button onClick={() => remove(t.id)} className={`flex-shrink-0 ${isEmergency ? "text-red-200 hover:text-white" : "text-brand-400 hover:text-brand-700"}`}>
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
  return useContext(ToastContext);
}
