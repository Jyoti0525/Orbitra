import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const ToastContext = React.createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'success', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        if (duration) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            {createPortal(
                <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                    {toasts.map(toast => (
                        <div
                            key={toast.id}
                            className={`
                min-w-[300px] p-4 rounded-lg shadow-lg transform transition-all duration-300 animate-slide-in
                flex items-center gap-3 text-white border
                ${toast.type === 'success' ? 'bg-gray-900/90 border-green-500/50' : ''}
                ${toast.type === 'error' ? 'bg-gray-900/90 border-red-500/50' : ''}
                ${toast.type === 'info' ? 'bg-gray-900/90 border-blue-500/50' : ''}
              `}
                        >
                            <div className={`
                w-6 h-6 rounded-full flex items-center justify-center text-sm
                ${toast.type === 'success' ? 'bg-green-500/20 text-green-400' : ''}
                ${toast.type === 'error' ? 'bg-red-500/20 text-red-400' : ''}
                ${toast.type === 'info' ? 'bg-blue-500/20 text-blue-400' : ''}
              `}>
                                {toast.type === 'success' && '✓'}
                                {toast.type === 'error' && '✕'}
                                {toast.type === 'info' && 'ℹ'}
                            </div>
                            <p className="text-sm font-medium">{toast.message}</p>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="ml-auto text-gray-400 hover:text-white"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = React.useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

