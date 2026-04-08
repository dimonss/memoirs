import { useEffect } from 'react';
import { X, LogOut } from 'lucide-react';

interface LogoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="login-modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            role="dialog"
            aria-modal="true"
        >
            <div className="login-modal logout-modal">
                <button
                    className="login-modal-close icon-btn"
                    onClick={onClose}
                    title="Отмена"
                >
                    <X size={20} />
                </button>

                <div className="login-modal-header">
                    <div className="login-modal-icon logout-icon">
                        <LogOut size={28} />
                    </div>
                    <h2 className="login-modal-title">Выход из аккаунта</h2>
                    <p className="login-modal-subtitle">
                        Вы действительно хотите выйти? Загрузка ваших закладок будет приостановлена.
                    </p>
                </div>

                <div className="logout-modal-actions">
                    <button className="btn btn-ghost" onClick={onClose}>
                        Отмена
                    </button>
                    <button className="btn btn-danger" onClick={onConfirm}>
                        Выйти
                    </button>
                </div>
            </div>
        </div>
    );
}
