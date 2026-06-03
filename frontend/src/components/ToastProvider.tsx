"use client";
import { useState, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastContextType {
  showToast: (msg: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: ToastType }[]>([]);

  const showToast = (msg: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: "fixed", bottom: "2rem", right: "2rem", zIndex: 9999, display: "flex", flexDirection: "column", gap: "1rem" }}>
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              style={{
                background: "var(--bg-side)",
                border: "1px solid var(--border)",
                padding: "1rem 1.5rem",
                borderRadius: "12px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                minWidth: "300px"
              }}
            >
              {t.type === "success" && <CheckCircle color="#10b981" size={20} />}
              {t.type === "error" && <AlertCircle color="#ef4444" size={20} />}
              {t.type === "info" && <Info color="#3b82f6" size={20} />}
              <span style={{ fontSize: "0.9rem", color: "white", flex: 1 }}>{t.msg}</span>
              <X 
                size={16} 
                style={{ cursor: "pointer", color: "var(--text-secondary)" }} 
                onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};
