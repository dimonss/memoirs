import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, AlertTriangle, UserPlus, X } from 'lucide-react';
import { useAuth, type TelegramLoginData } from '../../../context/AuthContext';
import './LogoutModal.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
const TELEGRAM_BOT_NAME = import.meta.env.VITE_TELEGRAM_BOT_NAME ?? '';

interface LogoutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LogoutModal({ isOpen, onClose }: LogoutModalProps) {
    const { logout, loginWithGoogle, loginWithTelegram, availableProviders } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const googleBtnRef = useRef<HTMLDivElement>(null);
    const tgContainerRef = useRef<HTMLDivElement>(null);

    const hasGoogle = availableProviders.includes('google');
    const hasTelegram = availableProviders.includes('telegram');

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    // Init Telegram widget if only Google is logged in
    useEffect(() => {
        if (!isOpen || hasTelegram || !TELEGRAM_BOT_NAME || !tgContainerRef.current) return;

        tgContainerRef.current.innerHTML = '';

        window.onTelegramAuth = async (userData: TelegramLoginData) => {
            setIsProcessing(true);
            try {
                await loginWithTelegram(userData);
            } catch (err) {
                console.error('Telegram auth failed in LogoutModal:', err);
            } finally {
                setIsProcessing(false);
            }
        };

        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        script.setAttribute('data-telegram-login', TELEGRAM_BOT_NAME);
        script.setAttribute('data-size', 'large');
        script.setAttribute('data-radius', '12');
        script.setAttribute('data-onauth', 'onTelegramAuth(user)');
        script.setAttribute('data-request-access', 'write');
        script.async = true;
        tgContainerRef.current.appendChild(script);

        return () => {
            delete window.onTelegramAuth;
        };
    }, [isOpen, hasTelegram, loginWithTelegram]);

    // Init Google button if only Telegram is logged in
    useEffect(() => {
        if (!isOpen || hasGoogle || !GOOGLE_CLIENT_ID || !googleBtnRef.current) return;

        const initGoogle = () => {
            if (!window.google?.accounts?.id || !googleBtnRef.current) return;

            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: async (response) => {
                    setIsProcessing(true);
                    try {
                        await loginWithGoogle(response.credential);
                    } catch (err) {
                        console.error('Google auth failed in LogoutModal:', err);
                    } finally {
                        setIsProcessing(false);
                    }
                },
            });

            googleBtnRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnRef.current, {
                theme: 'filled_black',
                size: 'large',
                shape: 'pill',
            });
        };

        if (window.google?.accounts?.id) {
            initGoogle();
        } else {
            const script = document.getElementById('google-gsi-script');
            if (script) {
                script.addEventListener('load', initGoogle);
                return () => script.removeEventListener('load', initGoogle);
            }
        }
    }, [isOpen, hasGoogle, loginWithGoogle]);

    if (!isOpen) return null;

    const handleLogoutProvider = async (provider: 'google' | 'telegram') => {
        setIsProcessing(true);
        try {
            await logout(provider);
            if (availableProviders.length <= 1) {
                onClose();
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleLogoutAll = async () => {
        setIsProcessing(true);
        try {
            await logout('all');
            onClose();
        } finally {
            setIsProcessing(false);
        }
    };

    return createPortal(
        <div
            className="memoirs-logout-modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            role="dialog"
            aria-modal="true"
        >
            <div className="memoirs-logout-modal-card">
                {/* Header */}
                <div className="memoirs-logout-header">
                    <div className="memoirs-logout-header-left">
                        <div className="memoirs-logout-icon-box">
                            <LogOut size={22} />
                        </div>
                        <div>
                            <h3 className="memoirs-logout-title">Выход из аккаунта</h3>
                            <div className="memoirs-logout-subtitle">Управление активными сессиями</div>
                        </div>
                    </div>
                    <button
                        className="memoirs-logout-close-btn"
                        onClick={onClose}
                        title="Закрыть"
                        aria-label="Закрыть"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* SSO Warning */}
                <div className="memoirs-sso-warning">
                    <AlertTriangle size={20} className="memoirs-sso-warning-icon" />
                    <div>
                        <strong>Сквозная авторизация экосистемы chalysh.pro</strong>
                        Выход будет выполнен во всех подключенных веб-приложениях экосистемы
                        (HealthChecker, Брелоки, Ретроспектива, Валидатор ТЗ, Space Shooter, ChalyshAuth, Воспоминания).
                    </div>
                </div>

                {/* Both providers authorized */}
                {hasGoogle && hasTelegram ? (
                    <div className="memoirs-logout-options">
                        <div className="memoirs-logout-section-title">
                            Выберите вариант выхода:
                        </div>

                        <div className="memoirs-logout-option-row">
                            <div className="memoirs-logout-option-info">
                                <span className="memoirs-logout-option-title">🔵 Google</span>
                                <span className="memoirs-logout-option-sub">
                                    Выйти из Google во всех сервисах. Telegram останется активным.
                                </span>
                            </div>
                            <button
                                disabled={isProcessing}
                                className="btn btn-secondary memoirs-logout-btn"
                                onClick={() => handleLogoutProvider('google')}
                            >
                                Выйти из Google
                            </button>
                        </div>

                        <div className="memoirs-logout-option-row">
                            <div className="memoirs-logout-option-info">
                                <span className="memoirs-logout-option-title">✈️ Telegram</span>
                                <span className="memoirs-logout-option-sub">
                                    Выйти из Telegram во всех сервисах. Google останется активным.
                                </span>
                            </div>
                            <button
                                disabled={isProcessing}
                                className="btn btn-secondary memoirs-logout-btn"
                                onClick={() => handleLogoutProvider('telegram')}
                            >
                                Выйти из Telegram
                            </button>
                        </div>

                        <div className="memoirs-logout-option-row memoirs-logout-danger-row">
                            <div className="memoirs-logout-option-info">
                                <span className="memoirs-logout-option-title memoirs-text-danger">
                                    🚪 Выйти со всех сразу
                                </span>
                                <span className="memoirs-logout-option-sub">
                                    Полный выход из обоих аккаунтов во всех сервисах chalysh.pro.
                                </span>
                            </div>
                            <button
                                disabled={isProcessing}
                                className="btn btn-danger memoirs-logout-btn"
                                onClick={handleLogoutAll}
                            >
                                Выйти со всех
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Single provider authorized */
                    <div className="memoirs-logout-options">
                        <div className="memoirs-logout-option-row">
                            <div className="memoirs-logout-option-info">
                                <span className="memoirs-logout-option-title">
                                    {hasGoogle ? '🔵 Google (активен)' : '✈️ Telegram (активен)'}
                                </span>
                                <span className="memoirs-logout-option-sub">
                                    Текущий аккаунт в сервисе
                                </span>
                            </div>
                            <button
                                disabled={isProcessing}
                                className="btn btn-danger memoirs-logout-btn"
                                onClick={handleLogoutAll}
                            >
                                Выйти со всех сервисов
                            </button>
                        </div>

                        {/* Add second provider */}
                        <div className="memoirs-add-provider-box">
                            <div className="memoirs-add-provider-header">
                                <UserPlus size={16} />
                                <span>Войти другим способом</span>
                            </div>
                            <p className="memoirs-add-provider-desc">
                                {hasGoogle
                                    ? 'Вы можете также войти через Telegram, чтобы переключаться между разными профилями:'
                                    : 'Вы можете также войти через Google, чтобы переключаться между разными профилями:'}
                            </p>
                            <div className="memoirs-add-provider-widget">
                                {hasGoogle ? (
                                    <div ref={tgContainerRef}></div>
                                ) : (
                                    <div ref={googleBtnRef}></div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="memoirs-logout-actions">
                    <button className="btn btn-ghost" onClick={onClose} disabled={isProcessing}>
                        Отмена
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
