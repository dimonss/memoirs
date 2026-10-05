/**
 * AuthService — singleton client for ChalyshAuth API.
 *
 * Handles Google & Telegram login, token management (localStorage),
 * auto-refresh, user profile, and additionalFields.
 */

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3333';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface AuthUser {
    id: string;
    telegramId: string | null;
    googleId: string | null;
    email: string | null;
    firstName: string;
    lastName: string | null;
    username: string | null;
    photoUrl: string | null;
}

export interface AuthResult {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
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

export type AuthProviderType = 'google' | 'telegram';
export const APP_ID = 'memoirs';
const APP_PROVIDER_KEY = `${APP_ID}_auth_provider`;

/* ------------------------------------------------------------------ */
/*  Storage helpers                                                    */
/* ------------------------------------------------------------------ */

export function hasTokensFor(provider: AuthProviderType): boolean {
    return !!localStorage.getItem(`${provider}_accessToken`) && !!localStorage.getItem(`${provider}_refreshToken`);
}

export function getAvailableProviders(): AuthProviderType[] {
    const list: AuthProviderType[] = [];
    if (hasTokensFor('google')) list.push('google');
    if (hasTokensFor('telegram')) list.push('telegram');
    return list;
}

export function getActiveProvider(): AuthProviderType | null {
    const hasGoogle = hasTokensFor('google');
    const hasTelegram = hasTokensFor('telegram');

    if (!hasGoogle && !hasTelegram) {
        return null;
    }
    if (hasGoogle && !hasTelegram) {
        return 'google';
    }
    if (hasTelegram && !hasGoogle) {
        return 'telegram';
    }

    const stored = localStorage.getItem(APP_PROVIDER_KEY) as AuthProviderType | null;
    if (stored === 'google' || stored === 'telegram') {
        return stored;
    }

    return 'google';
}

export function setActiveProvider(provider: AuthProviderType): void {
    localStorage.setItem(APP_PROVIDER_KEY, provider);
}

export function getTokens(): {
    accessToken: string | null;
    refreshToken: string | null;
    provider: AuthProviderType | null;
} {
    const provider = getActiveProvider();
    if (!provider) {
        return { accessToken: null, refreshToken: null, provider: null };
    }
    return {
        accessToken: localStorage.getItem(`${provider}_accessToken`),
        refreshToken: localStorage.getItem(`${provider}_refreshToken`),
        provider,
    };
}

export function setTokens(access: string, refresh: string, provider?: AuthProviderType): void {
    const target = provider || getActiveProvider() || 'google';
    localStorage.setItem(`${target}_accessToken`, access);
    localStorage.setItem(`${target}_refreshToken`, refresh);
    localStorage.setItem(APP_PROVIDER_KEY, target);
}

export function saveUser(user: AuthUser, provider?: AuthProviderType): void {
    const target = provider || getActiveProvider() || 'google';
    localStorage.setItem(`${target}_user`, JSON.stringify(user));
}

export function loadUser(provider?: AuthProviderType): AuthUser | null {
    const target = provider || getActiveProvider();
    if (!target) return null;
    const raw = localStorage.getItem(`${target}_user`);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as AuthUser;
    } catch {
        return null;
    }
}

export function clearTokens(target?: AuthProviderType | 'all' | boolean): void {
    if (target === 'all' || target === false) {
        localStorage.removeItem('google_accessToken');
        localStorage.removeItem('google_refreshToken');
        localStorage.removeItem('google_user');
        localStorage.removeItem('telegram_accessToken');
        localStorage.removeItem('telegram_refreshToken');
        localStorage.removeItem('telegram_user');
        localStorage.removeItem(APP_PROVIDER_KEY);
        return;
    }

    const providerToRemove = (target === 'google' || target === 'telegram') ? target : getActiveProvider();
    if (providerToRemove) {
        localStorage.removeItem(`${providerToRemove}_accessToken`);
        localStorage.removeItem(`${providerToRemove}_refreshToken`);
        localStorage.removeItem(`${providerToRemove}_user`);
        const remaining = getActiveProvider();
        if (remaining) {
            localStorage.setItem(APP_PROVIDER_KEY, remaining);
        } else {
            localStorage.removeItem(APP_PROVIDER_KEY);
        }
    }
}

/* ------------------------------------------------------------------ */
/*  AuthService class                                                  */
/* ------------------------------------------------------------------ */

class AuthService {
    /* --- state ---------------------------------------------------- */

    isLoggedIn(): boolean {
        return !!getTokens().accessToken && !!this.getUser();
    }

    getUser(): AuthUser | null {
        return loadUser();
    }

    /* --- auth ----------------------------------------------------- */

    async loginWithTelegram(data: TelegramLoginData): Promise<AuthResult> {
        const res = await fetch(`${API_BASE}/api/auth/telegram`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error((err as { message?: string }).message || 'Telegram login failed');
        }

        const result: AuthResult = await res.json();
        setTokens(result.accessToken, result.refreshToken, 'telegram');
        saveUser(result.user, 'telegram');
        return result;
    }

    async loginWithGoogle(idToken: string): Promise<AuthResult> {
        const res = await fetch(`${API_BASE}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error((err as { message?: string }).message || 'Google login failed');
        }

        const result: AuthResult = await res.json();
        setTokens(result.accessToken, result.refreshToken, 'google');
        saveUser(result.user, 'google');
        return result;
    }

    async refreshTokens(provider?: AuthProviderType): Promise<boolean> {
        const target = provider || getActiveProvider();
        if (!target) return false;
        const rt = localStorage.getItem(`${target}_refreshToken`);
        if (!rt) return false;

        try {
            const res = await fetch(`${API_BASE}/api/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: rt }),
            });

            if (!res.ok) {
                clearTokens(target);
                return false;
            }

            const data: { accessToken: string; refreshToken: string } = await res.json();
            setTokens(data.accessToken, data.refreshToken, target);
            return true;
        } catch {
            clearTokens(target);
            return false;
        }
    }

    async logout(provider?: AuthProviderType | 'all'): Promise<void> {
        if (provider === 'all') {
            const gRefresh = localStorage.getItem('google_refreshToken');
            const tgRefresh = localStorage.getItem('telegram_refreshToken');
            if (gRefresh) {
                await fetch(`${API_BASE}/api/auth/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken: gRefresh }),
                }).catch(() => {});
            }
            if (tgRefresh) {
                await fetch(`${API_BASE}/api/auth/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken: tgRefresh }),
                }).catch(() => {});
            }
            clearTokens('all');
        } else if (provider) {
            const rt = localStorage.getItem(`${provider}_refreshToken`);
            if (rt) {
                await fetch(`${API_BASE}/api/auth/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken: rt }),
                }).catch(() => {});
            }
            clearTokens(provider);
        } else {
            const { refreshToken, provider: activeProv } = getTokens();
            if (refreshToken) {
                await fetch(`${API_BASE}/api/auth/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                }).catch(() => {});
            }
            clearTokens(activeProv || undefined);
        }
    }

    /* --- authorised requests -------------------------------------- */

    private async authFetch(url: string, options: RequestInit = {}): Promise<Response> {
        const { accessToken } = getTokens();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {}),
        };
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

        let res = await fetch(url, { ...options, headers });

        // If 401 — try to refresh and retry once
        if (res.status === 401) {
            const refreshed = await this.refreshTokens();
            if (refreshed) {
                const newToken = getTokens().accessToken;
                if (newToken) headers['Authorization'] = `Bearer ${newToken}`;
                res = await fetch(url, { ...options, headers });
            }
        }

        return res;
    }

    /* --- profile & fields ----------------------------------------- */

    async getProfile(): Promise<AuthUser | null> {
        try {
            const res = await this.authFetch(`${API_BASE}/api/user/me`);
            if (!res.ok) return null;
            const data = await res.json();
            const user = data as AuthUser;
            const prov = getActiveProvider();
            if (prov) saveUser(user, prov);
            return user;
        } catch {
            return null;
        }
    }

    async getFields(): Promise<Record<string, unknown>> {
        try {
            const res = await this.authFetch(`${API_BASE}/api/user/me/fields`);
            if (!res.ok) return {};
            const data = await res.json();
            return (data as { additionalFields: Record<string, unknown> }).additionalFields ?? {};
        } catch {
            return {};
        }
    }

    async updateFields(fields: Record<string, unknown>): Promise<void> {
        const res = await this.authFetch(`${API_BASE}/api/user/me/fields`, {
            method: 'PATCH',
            body: JSON.stringify(fields),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error((err as { message?: string }).message || 'Failed to update fields');
        }
    }

    /**
     * Try to restore the session from localStorage.
     * Returns true if the user is still authenticated.
     */
    async tryRestoreSession(): Promise<boolean> {
        const { accessToken, refreshToken } = getTokens();
        if (!accessToken || !refreshToken) {
            return false;
        }
        const profile = await this.getProfile();
        return !!profile;
    }

    async switchProvider(provider: AuthProviderType): Promise<AuthUser | null> {
        setActiveProvider(provider);
        const user = loadUser(provider);
        if (user) {
            return user;
        }
        return await this.getProfile();
    }
}

/* ------------------------------------------------------------------ */
/*  Singleton                                                          */
/* ------------------------------------------------------------------ */

export const authService = new AuthService();
