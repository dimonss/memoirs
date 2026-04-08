import { useState, useEffect, useRef } from 'react';
import { X, LogIn } from 'lucide-react';
import { useAuth, type TelegramLoginData } from '../../context/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
const TELEGRAM_BOT_NAME = import.meta.env.VITE_TELEGRAM_BOT_NAME ?? '';

/* ------------------------------------------------------------------ */
/*  Google type declarations                                           */
/* ------------------------------------------------------------------ */

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: {
                        client_id: string;
                        callback: (response: { credential: string }) => void;
                        auto_select?: boolean;
                    }) => void;
                    renderButton: (element: HTMLElement, options: object) => void;
                    prompt: () => void;
                };
            };
        };
        onTelegramAuth?: (user: TelegramLoginData) => void;
    }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const { loginWithGoogle, loginWithTelegram } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const googleBtnRef = useRef<HTMLDivElement>(null);
    const tgContainerRef = useRef<HTMLDivElement>(null);

    // Google Sign-In
    useEffect(() => {
        if (!isOpen || !GOOGLE_CLIENT_ID) return;

        const initGoogle = () => {
            if (!window.google) return;

            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: async (response) => {
                    setError(null);
                    setLoading(true);
                    try {
                        await loginWithGoogle(response.credential);
                        onClose();
                    } catch (e) {
                        setError(e instanceof Error ? e.message : 'Ошибка входа через Google');
                    } finally {
                        setLoading(false);
                    }
                },
            });

            if (googleBtnRef.current) {
                window.google.accounts.id.renderButton(googleBtnRef.current, {
                    theme: 'filled_black',
                    size: 'large',
                    width: 280,
                    text: 'signin_with',
                    shape: 'pill',
                    logo_alignment: 'center',
                });
            }
        };

        if (window.google) {
            initGoogle();
        } else {
            const script = document.getElementById('google-gsi-script');
            if (script) {
                script.addEventListener('load', initGoogle);
                return () => script.removeEventListener('load', initGoogle);
            }
        }
    }, [isOpen, loginWithGoogle, onClose]);

    // Telegram Login Widget
    useEffect(() => {
        if (!isOpen || !TELEGRAM_BOT_NAME || !tgContainerRef.current) return;

        // Clear previous widget
        tgContainerRef.current.innerHTML = '';

        window.onTelegramAuth = async (userData: TelegramLoginData) => {
            setError(null);
            setLoading(true);
            try {
                await loginWithTelegram(userData);
                onClose();
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Ошибка входа через Telegram');
            } finally {
                setLoading(false);
            }
        };

        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        script.setAttribute('data-telegram-login', TELEGRAM_BOT_NAME);
        script.setAttribute('data-size', 'large');
        script.setAttribute('data-onauth', 'onTelegramAuth(user)');
        script.setAttribute('data-request-access', 'write');
        script.async = true;

        tgContainerRef.current.appendChild(script);

        return () => {
            delete window.onTelegramAuth;
        };
    }, [isOpen, loginWithTelegram, onClose]);

    // Close on Escape
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
            aria-label="Вход в приложение"
        >
            <div className="login-modal">
                <button
                    className="login-modal-close icon-btn"
                    onClick={onClose}
                    title="Закрыть"
                    aria-label="Закрыть"
                >
                    <X size={20} />
                </button>

                <div className="login-modal-header">
                    <div className="login-modal-icon">
                        <LogIn size={28} />
                    </div>
                    <h2 className="login-modal-title">Добро пожаловать</h2>
                    <p className="login-modal-subtitle">
                        Войдите, чтобы сохранять закладки и прогресс чтения между устройствами
                    </p>
                </div>

                {error && (
                    <div className="login-modal-error" role="alert">
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="login-modal-loading">
                        <div className="spinner" />
                        <span>Входим...</span>
                    </div>
                )}

                <div className="login-modal-providers" style={{ display: loading ? 'none' : 'flex' }}>
                    {/* Google */}
                    {GOOGLE_CLIENT_ID && (
                        <div className="login-provider-section">
                            <div
                                ref={googleBtnRef}
                                className="login-google-btn-wrapper"
                                id="google-signin-btn"
                            />
                        </div>
                    )}

                    {/* Divider */}
                    {GOOGLE_CLIENT_ID && TELEGRAM_BOT_NAME && (
                        <div className="login-divider">
                            <span>или</span>
                        </div>
                    )}

                    {/* Telegram */}
                    {TELEGRAM_BOT_NAME && (
                        <div className="login-provider-section">
                            <div
                                ref={tgContainerRef}
                                className="login-telegram-btn-wrapper"
                                id="telegram-signin-btn"
                            />
                        </div>
                    )}
                </div>

                <p className="login-modal-disclaimer">
                    Авторизуясь, вы принимаете условия использования сервиса
                </p>
            </div>
        </div>
    );
}
