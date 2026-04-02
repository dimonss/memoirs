import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { chapters } from '../data/chapters';

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

interface BookContextType {
    // Position
    currentPosition: ReadingPosition;
    setPosition: (chapterId: string, pageId: string) => void;

    // Bookmarks
    bookmarks: Bookmark[];
    addBookmark: (chapterId: string, pageId: string) => void;
    removeBookmark: (chapterId: string, pageId: string) => void;
    isBookmarked: (chapterId: string, pageId: string) => boolean;

    // Sidebar
    sidebarOpen: boolean;
    toggleSidebar: () => void;
    closeSidebar: () => void;

    // Reading progress
    readingProgress: Record<string, number>; // chapterId -> last read page index
    getChapterProgress: (chapterId: string) => number;
}

const STORAGE_KEY_POSITION = 'memoirs-opus-position';
const STORAGE_KEY_BOOKMARKS = 'memoirs-opus-bookmarks';
const STORAGE_KEY_PROGRESS = 'memoirs-opus-progress';

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

const BookContext = createContext<BookContextType | null>(null);

export function BookProvider({ children }: { children: React.ReactNode }) {
    const [currentPosition, setCurrentPosition] = useState<ReadingPosition>(
        () => loadFromStorage(STORAGE_KEY_POSITION, defaultPosition)
    );
    const [bookmarks, setBookmarks] = useState<Bookmark[]>(
        () => loadFromStorage(STORAGE_KEY_BOOKMARKS, [])
    );
    const [readingProgress, setReadingProgress] = useState<Record<string, number>>(
        () => loadFromStorage(STORAGE_KEY_PROGRESS, {})
    );
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Persist position
    useEffect(() => {
        saveToStorage(STORAGE_KEY_POSITION, currentPosition);
    }, [currentPosition]);

    // Persist bookmarks
    useEffect(() => {
        saveToStorage(STORAGE_KEY_BOOKMARKS, bookmarks);
    }, [bookmarks]);

    // Persist progress
    useEffect(() => {
        saveToStorage(STORAGE_KEY_PROGRESS, readingProgress);
    }, [readingProgress]);

    const setPosition = useCallback((chapterId: string, pageId: string) => {
        setCurrentPosition({ chapterId, pageId });
        // Update reading progress
        const chapter = chapters.find(c => c.id === chapterId);
        if (chapter) {
            const pageIndex = chapter.pages.findIndex(p => p.id === pageId);
            setReadingProgress(prev => {
                const current = prev[chapterId] || 0;
                if (pageIndex > current) {
                    return { ...prev, [chapterId]: pageIndex };
                }
                return prev;
            });
        }
    }, []);

    const addBookmark = useCallback((chapterId: string, pageId: string) => {
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
        setBookmarks(prev => [...prev, bookmark]);
    }, []);

    const removeBookmark = useCallback((chapterId: string, pageId: string) => {
        setBookmarks(prev => prev.filter(b => !(b.chapterId === chapterId && b.pageId === pageId)));
    }, []);

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
        }}>
            {children}
        </BookContext.Provider>
    );
}

export function useBook() {
    const ctx = useContext(BookContext);
    if (!ctx) throw new Error('useBook must be used within BookProvider');
    return ctx;
}
