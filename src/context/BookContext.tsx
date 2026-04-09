import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { chapters } from '../data/chapters';
import { authService } from '../services/AuthService';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface Bookmark {
    id: string;
    chapterId: string;
    pageId: string;
    chapterTitle: string;
    pageNumber: number;
    createdAt: number;
}

interface ReadingPosition {
    chapterId: string;
    pageId: string;
}

/** Shape stored in additionalFields.memoirs on the backend */
interface MemoirsFields {
    bookmarks?: Bookmark[];
    readingProgress?: Record<string, number>;
    lastPosition?: ReadingPosition;
}

interface BookContextType {
    currentPosition: ReadingPosition;
    setPosition: (chapterId: string, pageId: string) => void;

    bookmarks: Bookmark[];
    addBookmark: (chapterId: string, pageId: string) => void;
    removeBookmark: (chapterId: string, pageId: string) => void;
    isBookmarked: (chapterId: string, pageId: string) => boolean;

    sidebarOpen: boolean;
    toggleSidebar: () => void;
    closeSidebar: () => void;

    readingProgress: Record<string, number>;
    getChapterProgress: (chapterId: string) => number;

    requiresAuth: boolean;
    isSyncing: boolean;
}

/* ------------------------------------------------------------------ */
/*  Storage helpers (localStorage — only for position & progress)     */
/* ------------------------------------------------------------------ */

const STORAGE_KEY_POSITION = 'memoirs-position';
const STORAGE_KEY_PROGRESS = 'memoirs-progress';
const APP_KEY = 'memoirs';

const defaultPosition: ReadingPosition = {
    chapterId: chapters[0].id,
    pageId: chapters[0].pages[0].id,
};

function loadFromStorage<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return fallback;
}

function saveToStorage<T>(key: string, value: T) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch { /* ignore */ }
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const BookContext = createContext<BookContextType | null>(null);

interface BookProviderProps {
    children: React.ReactNode;
    onAuthRequired?: () => void;
}

export function BookProvider({ children, onAuthRequired }: BookProviderProps): React.ReactElement {
    const [currentPosition, setCurrentPosition] = useState<ReadingPosition>(
        () => loadFromStorage(STORAGE_KEY_POSITION, defaultPosition)
    );
    const [readingProgress, setReadingProgress] = useState<Record<string, number>>(
        () => loadFromStorage(STORAGE_KEY_PROGRESS, {})
    );
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const progressSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* ---------------------------------------------------------------- */
    /*  Persist position & progress to localStorage                      */
    /* ---------------------------------------------------------------- */
    useEffect(() => {
        saveToStorage(STORAGE_KEY_POSITION, currentPosition);
    }, [currentPosition]);

    useEffect(() => {
        saveToStorage(STORAGE_KEY_PROGRESS, readingProgress);
    }, [readingProgress]);

    /* ---------------------------------------------------------------- */
    /*  Load data from backend                                           */
    /* ---------------------------------------------------------------- */
    const syncFromBackend = useCallback(async () => {
        if (!authService.isLoggedIn()) return;

        try {
            const fields = await authService.getFields();
            const appData = (fields[APP_KEY] as MemoirsFields | undefined) ?? {};

            if (appData.bookmarks) {
                setBookmarks(appData.bookmarks);
            }

            if (appData.readingProgress) {
                setReadingProgress(prev => {
                    const merged = { ...prev };
                    for (const [chapId, pageIdx] of Object.entries(appData.readingProgress!)) {
                        if ((merged[chapId] ?? -1) < pageIdx) {
                            merged[chapId] = pageIdx;
                        }
                    }
                    saveToStorage(STORAGE_KEY_PROGRESS, merged);
                    return merged;
                });
            }

            if (appData.lastPosition) {
                const saved = loadFromStorage<ReadingPosition | null>(STORAGE_KEY_POSITION, null);
                if (!saved || saved.chapterId === defaultPosition.chapterId) {
                    setCurrentPosition(appData.lastPosition);
                }
            }
        } catch (err) {
            console.error('[ChalyshMemoirs] Failed to sync from backend:', err);
        }
    }, []);

    const clearBookmarks = useCallback(() => {
        setBookmarks([]);
    }, []);

    // Run once on mount (if session already exists)
    useEffect(() => {
        syncFromBackend();
    }, [syncFromBackend]);

    // Expose to AuthContext via module-level ref
    useEffect(() => {
        bookContextSyncRef.syncFromBackend = syncFromBackend;
        bookContextSyncRef.clearBookmarks = clearBookmarks;
    }, [syncFromBackend, clearBookmarks]);

    /* ---------------------------------------------------------------- */
    /*  Sync progress to backend (debounced 3s)                          */
    /* ---------------------------------------------------------------- */
    const syncProgressToBackend = useCallback((
        progress: Record<string, number>,
        position: ReadingPosition,
    ) => {
        if (!authService.isLoggedIn()) return;

        if (progressSyncTimer.current) clearTimeout(progressSyncTimer.current);
        progressSyncTimer.current = setTimeout(async () => {
            try {
                const fields = await authService.getFields();
                const appData = (fields[APP_KEY] as MemoirsFields | undefined) ?? {};
                await authService.updateFields({
                    [APP_KEY]: {
                        ...appData,
                        readingProgress: progress,
                        lastPosition: position,
                    },
                });
            } catch (err) {
                console.error('[ChalyshMemoirs] Failed to sync progress:', err);
            }
        }, 3000);
    }, []);

    /* ---------------------------------------------------------------- */
    /*  Sync bookmarks to backend immediately                            */
    /* ---------------------------------------------------------------- */
    const syncBookmarksToBackend = useCallback(async (newBookmarks: Bookmark[]) => {
        if (!authService.isLoggedIn()) return;

        setIsSyncing(true);
        try {
            const fields = await authService.getFields();
            const appData = (fields[APP_KEY] as MemoirsFields | undefined) ?? {};
            await authService.updateFields({
                [APP_KEY]: {
                    ...appData,
                    bookmarks: newBookmarks,
                },
            });
        } catch (err) {
            console.error('[ChalyshMemoirs] Failed to sync bookmarks:', err);
        } finally {
            setIsSyncing(false);
        }
    }, []);

    /* ---------------------------------------------------------------- */
    /*  Actions                                                          */
    /* ---------------------------------------------------------------- */

    const setPosition = useCallback((chapterId: string, pageId: string) => {
        const next = { chapterId, pageId };
        saveToStorage(STORAGE_KEY_POSITION, next);
        setCurrentPosition(next);

        const chapter = chapters.find(c => c.id === chapterId);
        if (chapter) {
            const pageIndex = chapter.pages.findIndex(p => p.id === pageId);
            setReadingProgress(prev => {
                const current = prev[chapterId] ?? -1;
                if (pageIndex > current) {
                    const updated = { ...prev, [chapterId]: pageIndex };
                    syncProgressToBackend(updated, next);
                    return updated;
                }
                syncProgressToBackend(prev, next);
                return prev;
            });
        }
    }, [syncProgressToBackend]);

    const addBookmark = useCallback((chapterId: string, pageId: string) => {
        if (!authService.isLoggedIn()) {
            onAuthRequired?.();
            return;
        }

        const chapter = chapters.find(c => c.id === chapterId);
        const page = chapter?.pages.find(p => p.id === pageId);
        if (!chapter || !page) return;

        const bookmark: Bookmark = {
            id: `${chapterId}-${pageId}`,
            chapterId,
            pageId,
            chapterTitle: chapter.title,
            pageNumber: page.number,
            createdAt: Date.now(),
        };

        setBookmarks(prev => {
            if (prev.some(b => b.id === bookmark.id)) return prev;
            const next = [...prev, bookmark];
            syncBookmarksToBackend(next);
            return next;
        });
    }, [onAuthRequired, syncBookmarksToBackend]);

    const removeBookmark = useCallback((chapterId: string, pageId: string) => {
        if (!authService.isLoggedIn()) {
            onAuthRequired?.();
            return;
        }

        setBookmarks(prev => {
            const next = prev.filter(b => !(b.chapterId === chapterId && b.pageId === pageId));
            syncBookmarksToBackend(next);
            return next;
        });
    }, [onAuthRequired, syncBookmarksToBackend]);

    const isBookmarked = useCallback((chapterId: string, pageId: string) => {
        return bookmarks.some(b => b.chapterId === chapterId && b.pageId === pageId);
    }, [bookmarks]);

    const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
    const closeSidebar = useCallback(() => setSidebarOpen(false), []);

    const getChapterProgress = useCallback((chapterId: string) => {
        const chapter = chapters.find(c => c.id === chapterId);
        if (!chapter) return 0;
        const lastPage = readingProgress[chapterId] ?? -1;
        return Math.round(((lastPage + 1) / chapter.pages.length) * 100);
    }, [readingProgress]);

    return (
        <BookContext.Provider value={{
            currentPosition,
            setPosition,
            bookmarks,
            addBookmark,
            removeBookmark,
            isBookmarked,
            sidebarOpen,
            toggleSidebar,
            closeSidebar,
            readingProgress,
            getChapterProgress,
            requiresAuth: false,
            isSyncing,
        }}>
            {children}
        </BookContext.Provider>
    );
}

/* ------------------------------------------------------------------ */
/*  Module-level ref so AuthContext can trigger sync after login       */
/* ------------------------------------------------------------------ */

export const bookContextSyncRef: {
    syncFromBackend: () => Promise<void>;
    clearBookmarks: () => void;
} = {
    syncFromBackend: async () => {},
    clearBookmarks: () => {},
};

export function useBook(): BookContextType {
    const ctx = useContext(BookContext);
    if (!ctx) throw new Error('useBook must be used within BookProvider');
    return ctx;
}
