import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
} from 'react';
import { authService, type AuthUser } from '../services/AuthService';
import { bookContextSyncRef } from './BookContext';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AuthContextType {
    user: AuthUser | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    loginWithGoogle: (idToken: string) => Promise<void>;
    loginWithTelegram: (data: TelegramLoginData) => Promise<void>;
    logout: () => Promise<void>;
    /** Call this to open the login modal (injected from App) */
    openLoginModal: () => void;
    setOpenLoginModal: (fn: () => void) => void;
}

export interface TelegramLoginData {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(() => authService.getUser());
    const [isLoading, setIsLoading] = useState(true);

    // openLoginModal is injected by App after render
    const openLoginModalRef = useRef<() => void>(() => {});

    // Restore session on mount
    useEffect(() => {
        let cancelled = false;
        authService.tryRestoreSession().then((ok) => {
            if (cancelled) return;
            if (ok) {
                const u = authService.getUser();
                setUser(u);
                // Sync book data once session is confirmed
                bookContextSyncRef.syncFromBackend();
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });
        return () => { cancelled = true; };
    }, []);

    const loginWithGoogle = useCallback(async (idToken: string) => {
        const result = await authService.loginWithGoogle(idToken);
        setUser(result.user);
        // Pull bookmarks & progress from backend after login
        await bookContextSyncRef.syncFromBackend();
    }, []);

    const loginWithTelegram = useCallback(async (data: TelegramLoginData) => {
        const result = await authService.loginWithTelegram(data);
        setUser(result.user);
        // Pull bookmarks & progress from backend after login
        await bookContextSyncRef.syncFromBackend();
    }, []);

    const logout = useCallback(async () => {
        await authService.logout();
        setUser(null);
        // Clear bookmarks from memory on logout
        bookContextSyncRef.clearBookmarks();
    }, []);

    const openLoginModal = useCallback(() => {
        openLoginModalRef.current();
    }, []);

    const setOpenLoginModal = useCallback((fn: () => void) => {
        openLoginModalRef.current = fn;
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            isLoggedIn: !!user,
            isLoading,
            loginWithGoogle,
            loginWithTelegram,
            logout,
            openLoginModal,
            setOpenLoginModal,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
