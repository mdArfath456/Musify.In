import { createContext, useContext, useState, useCallback } from "react";
import "./Toast.css";

const ToastContext = createContext(null);
let idCounter = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const dismiss = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback(
        (message, { type = "info", duration = 4000 } = {}) => {
            const id = ++idCounter;
            setToasts((prev) => [...prev, { id, message, type }]);
            if (duration) {
                setTimeout(() => dismiss(id), duration);
            }
            return id;
        },
        [dismiss]
    );

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-stack" role="status" aria-live="polite">
                {toasts.map((t) => (
                    <div key={t.id} className={`toast toast-${t.type}`} onClick={() => dismiss(t.id)}>
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
}