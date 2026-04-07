import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBook } from '../context/BookContext';
import { useAuth } from '../context/AuthContext';
import { getChapter } from '../data/chapters';
import {
    ChevronLeft,
    ChevronRight,
    Bookmark,
    BookmarkCheck,
    Menu,
    Lock,
    X,
} from 'lucide-react';

export default function Reader() {
    const { chapterId, pageId } = useParams<{ chapterId: string; pageId: string }>();
    const navigate = useNavigate();
    const {
        setPosition,
        isBookmarked,
        addBookmark,
        removeBookmark,
        toggleSidebar,
    } = useBook();
    const { isLoggedIn, openLoginModal } = useAuth();

    const chapter = chapterId ? getChapter(chapterId) : undefined;
    const page = chapter?.pages.find(p => p.id === pageId);
    const pageIndex = chapter?.pages.findIndex(p => p.id === pageId) ?? -1;

    // Auth hint banner state (shown briefly when unauth user tries to bookmark)
    const [showAuthHint, setShowAuthHint] = useState(false);

    // Sync position to context
    useEffect(() => {
        if (chapterId && pageId) {
            setPosition(chapterId, pageId);
        }
    }, [chapterId, pageId, setPosition]);

    // Keyboard navigation
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                goNext();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                goPrev();
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    if (!chapter || !page) {
        return (
            <div className="reader-empty">
                <div className="reader-empty-card">
                    <h2>Страница не найдена</h2>
                    <p>Выберите главу из содержания</p>
                    <button className="btn btn-primary" onClick={() => navigate('/')}>
                        К содержанию
                    </button>
                </div>
            </div>
        );
    }

    const bookmarked = isBookmarked(chapterId!, pageId!);

    function toggleBookmark() {
        if (!isLoggedIn) {
            // Show inline hint and open modal
            setShowAuthHint(true);
            openLoginModal();
            return;
        }
        if (bookmarked) {
            removeBookmark(chapterId!, pageId!);
        } else {
            addBookmark(chapterId!, pageId!);
        }
    }

    function goPrev() {
        if (!chapter) return;
        if (pageIndex > 0) {
            const prev = chapter.pages[pageIndex - 1];
            navigate(`/chapter/${chapter.id}/page/${prev.id}`);
        }
    }

    function goNext() {
        if (!chapter) return;
        if (pageIndex < chapter.pages.length - 1) {
            const next = chapter.pages[pageIndex + 1];
            navigate(`/chapter/${chapter.id}/page/${next.id}`);
        }
    }

    const hasPrev = pageIndex > 0;
    const hasNext = chapter && pageIndex < chapter.pages.length - 1;

    return (
        <div className="reader">
            {/* Auth hint banner */}
            {showAuthHint && !isLoggedIn && (
                <div className="auth-hint-banner" role="status">
                    <Lock size={14} />
                    <span>Войдите, чтобы сохранять закладки</span>
                    <button
                        className="auth-hint-login-btn"
                        onClick={() => { openLoginModal(); }}
                    >
                        Войти
                    </button>
                    <button
                        className="auth-hint-close"
                        onClick={() => setShowAuthHint(false)}
                        aria-label="Закрыть"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Top bar */}
            <header className="reader-header">
                <button className="icon-btn" onClick={toggleSidebar} title="Меню">
                    <Menu size={22} />
                </button>
                <div className="reader-header-info">
                    <span className="reader-chapter-label">Глава {chapter.number}</span>
                    <span className="reader-divider">·</span>
                    <span className="reader-page-label">
                        {pageIndex + 1} из {chapter.pages.length}
                    </span>
                </div>
                <button
                    className={`icon-btn bookmark-btn ${bookmarked ? 'active' : ''} ${!isLoggedIn ? 'bookmark-btn-locked' : ''}`}
                    onClick={toggleBookmark}
                    title={
                        !isLoggedIn
                            ? 'Войдите, чтобы добавить закладку'
                            : bookmarked
                                ? 'Убрать закладку'
                                : 'Добавить закладку'
                    }
                    id="reader-bookmark-btn"
                >
                    {!isLoggedIn
                        ? <Lock size={18} />
                        : bookmarked
                            ? <BookmarkCheck size={22} />
                            : <Bookmark size={22} />
                    }
                </button>
            </header>

            {/* Page content */}
            <main className="reader-body" key={`${chapterId}-${pageId}`}>
                <div className="page-card">
                    <div className="page-header">
                        <h1 className="page-chapter-title">{chapter.title}</h1>
                        <p className="page-subtitle">{chapter.subtitle}</p>
                    </div>
                    <div className="page-content">
                        {page.content.map((p, i) => (
                            <p key={i} className="page-paragraph">{p}</p>
                        ))}
                    </div>
                    <div className="page-footer">
                        <span className="page-number">{pageIndex + 1}</span>
                    </div>
                </div>
            </main>

            {/* Navigation */}
            <nav className="reader-nav">
                <button
                    className={`nav-btn nav-prev ${!hasPrev ? 'disabled' : ''}`}
                    onClick={goPrev}
                    disabled={!hasPrev}
                >
                    <ChevronLeft size={20} />
                    <span>Назад</span>
                </button>

                <div className="page-dots">
                    {chapter.pages.map((p, i) => (
                        <button
                            key={p.id}
                            className={`page-dot ${i === pageIndex ? 'active' : ''} ${i <= pageIndex ? 'read' : ''}`}
                            onClick={() => navigate(`/chapter/${chapter.id}/page/${p.id}`)}
                            title={`Страница ${i + 1}`}
                        />
                    ))}
                </div>

                <button
                    className={`nav-btn nav-next ${!hasNext ? 'disabled' : ''}`}
                    onClick={goNext}
                    disabled={!hasNext}
                >
                    <span>Вперёд</span>
                    <ChevronRight size={20} />
                </button>
            </nav>
        </div>
    );
}
