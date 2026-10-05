import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
} from 'react';
import {
    authService,
    getActiveProvider,
    getAvailableProviders,
    type AuthUser,
    type AuthProviderType,
} from '../services/AuthService';
import { bookContextSyncRef } from './BookContext';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface TelegramLoginData {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
}

interface AuthContextType {
    user: AuthUser | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    activeProvider: AuthProviderType | null;
    availableProviders: AuthProviderType[];
    loginWithGoogle: (idToken: string) => Promise<void>;
    loginWithTelegram: (data: TelegramLoginData) => Promise<void>;
    logout: (target?: AuthProviderType | 'all') => Promise<void>;
    switchProvider: (provider: AuthProviderType) => Promise<void>;
    /** Call this to open the login modal (injected from App) */
    openLoginModal: () => void;
    setOpenLoginModal: (fn: () => void) => void;
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(() => authService.getUser());
    const [isLoading, setIsLoading] = useState(true);
    const [activeProvider, setActiveProviderState] = useState<AuthProviderType | null>(() => getActiveProvider());
    const [availableProviders, setAvailableProvidersState] = useState<AuthProviderType[]>(() => getAvailableProviders());

    // openLoginModal is injected by App after render
    const openLoginModalRef = useRef<() => void>(() => {});

    const refreshState = useCallback(() => {
        const prov = getActiveProvider();
        setActiveProviderState(prov);
        setAvailableProvidersState(getAvailableProviders());
        setUser(authService.getUser());
    }, []);

    // Restore session on mount
    useEffect(() => {
        let cancelled = false;
        authService.tryRestoreSession().then((ok) => {
            if (cancelled) return;
            if (ok) {
                const u = authService.getUser();
                setUser(u);
                setActiveProviderState(getActiveProvider());
                setAvailableProvidersState(getAvailableProviders());
                bookContextSyncRef.syncFromBackend();
            } else {
                setUser(null);
                setActiveProviderState(getActiveProvider());
                setAvailableProvidersState(getAvailableProviders());
            }
            setIsLoading(false);
        });

        const handleStorage = (e: StorageEvent) => {
            if (e.key?.includes('accessToken') || e.key?.includes('auth_provider')) {
                refreshState();
            }
        };
        window.addEventListener('storage', handleStorage);

        return () => {
            cancelled = true;
            window.removeEventListener('storage', handleStorage);
        };
    }, [refreshState]);

    const loginWithGoogle = useCallback(async (idToken: string) => {
        const result = await authService.loginWithGoogle(idToken);
        setUser(result.user);
        setActiveProviderState(getActiveProvider());
        setAvailableProvidersState(getAvailableProviders());
        // Pull bookmarks & progress from backend after login
        await bookContextSyncRef.syncFromBackend();
    }, []);

    const loginWithTelegram = useCallback(async (data: TelegramLoginData) => {
        const result = await authService.loginWithTelegram(data);
        setUser(result.user);
        setActiveProviderState(getActiveProvider());
        setAvailableProvidersState(getAvailableProviders());
        // Pull bookmarks & progress from backend after login
        await bookContextSyncRef.syncFromBackend();
    }, []);

    const logout = useCallback(async (target?: AuthProviderType | 'all') => {
        await authService.logout(target);
        const remaining = getActiveProvider();
        if (remaining) {
            const u = authService.getUser();
            setUser(u);
            setActiveProviderState(remaining);
            setAvailableProvidersState(getAvailableProviders());
            await bookContextSyncRef.syncFromBackend();
        } else {
            setUser(null);
            setActiveProviderState(null);
            setAvailableProvidersState([]);
            bookContextSyncRef.clearBookmarks();
        }
    }, []);

    const switchProvider = useCallback(async (provider: AuthProviderType) => {
        setIsLoading(true);
        try {
            const u = await authService.switchProvider(provider);
            setUser(u);
            setActiveProviderState(provider);
            setAvailableProvidersState(getAvailableProviders());
            await bookContextSyncRef.syncFromBackend();
        } finally {
            setIsLoading(false);
        }
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
            activeProvider,
            availableProviders,
            loginWithGoogle,
            loginWithTelegram,
            logout,
            switchProvider,
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
