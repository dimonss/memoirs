import { useNavigate } from 'react-router-dom';
import { useBook } from '../context/BookContext';
import { useAuth } from '../context/AuthContext';
import { chapters } from '../data/chapters';
import {
    X,
    BookOpen,
    Bookmark as BookmarkIcon,
    Trash2,
    ChevronRight,
    LogIn,
    LogOut,
    Lock,
} from 'lucide-react';
import { useState } from 'react';

type Tab = 'chapters' | 'bookmarks';

interface SidebarProps {
    onLoginClick: () => void;
}

export default function Sidebar({ onLoginClick }: SidebarProps) {
    const navigate = useNavigate();
    const {
        sidebarOpen,
        closeSidebar,
        bookmarks,
        removeBookmark,
        currentPosition,
        getChapterProgress,
        isSyncing,
    } = useBook();
    const { user, isLoggedIn, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('chapters');

    function navigateTo(chapterId: string, pageId: string) {
        navigate(`/chapter/${chapterId}/page/${pageId}`);
        closeSidebar();
    }

    async function handleLogout() {
        await logout();
        closeSidebar();
    }

    function handleBookmarksTabClick() {
        if (!isLoggedIn) {
            onLoginClick();
            return;
        }
        setActiveTab('bookmarks');
    }

    // Display name helper
    const displayName = user
        ? (user.firstName || user.username || user.email?.split('@')[0] || 'Читатель')
        : null;

    return (
        <>
            {/* Overlay */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
                onClick={closeSidebar}
            />

            {/* Sidebar panel */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2 className="sidebar-title">Мемуары</h2>
                    <button className="icon-btn" onClick={closeSidebar}>
                        <X size={22} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="sidebar-tabs">
                    <button
                        className={`sidebar-tab ${activeTab === 'chapters' ? 'active' : ''}`}
                        onClick={() => setActiveTab('chapters')}
                    >
                        <BookOpen size={16} />
                        <span>Содержание</span>
                    </button>
                    <button
                        className={`sidebar-tab ${activeTab === 'bookmarks' ? 'active' : ''}`}
                        onClick={handleBookmarksTabClick}
                        title={isLoggedIn ? undefined : 'Войдите, чтобы использовать закладки'}
                    >
                        <BookmarkIcon size={16} />
                        <span>Закладки</span>
                        {isLoggedIn && bookmarks.length > 0 && (
                            <span className="badge">{bookmarks.length}</span>
                        )}
                        {!isLoggedIn && (
                            <Lock size={12} className="sidebar-tab-lock" />
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="sidebar-content">
                    {activeTab === 'chapters' && (
                        <ul className="chapter-list">
                            {chapters.map(ch => {
                                const isCurrent = currentPosition.chapterId === ch.id;
                                const progress = getChapterProgress(ch.id);
                                return (
                                    <li key={ch.id} className={`chapter-item ${isCurrent ? 'current' : ''}`}>
                                        <button
                                            className="chapter-link"
                                            onClick={() => navigateTo(ch.id, ch.pages[0].id)}
                                        >
                                            <div className="chapter-number-badge">
                                                {ch.number}
                                            </div>
                                            <div className="chapter-info">
                                                <span className="chapter-name">{ch.title}</span>
                                                <span className="chapter-subtitle">{ch.subtitle}</span>
                                                <div className="chapter-progress-bar">
                                                    <div
                                                        className="chapter-progress-fill"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="chapter-arrow" />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {activeTab === 'bookmarks' && isLoggedIn && (
                        <>
                            {isSyncing && (
                                <div className="sidebar-syncing">
                                    <div className="spinner spinner-sm" />
                                    <span>Сохраняем...</span>
                                </div>
                            )}
                            {bookmarks.length === 0 ? (
                                <div className="sidebar-empty">
                                    <BookmarkIcon size={48} strokeWidth={1} />
                                    <p>Нет сохранённых закладок</p>
                                    <span>Нажмите на иконку закладки при чтении, чтобы сохранить страницу</span>
                                </div>
                            ) : (
                                <ul className="bookmark-list">
                                    {bookmarks.map(bm => (
                                        <li key={bm.id} className="bookmark-item">
                                            <button
                                                className="bookmark-link"
                                                onClick={() => navigateTo(bm.chapterId, bm.pageId)}
                                            >
                                                <BookmarkIcon size={18} className="bookmark-icon" />
                                                <div className="bookmark-info">
                                                    <span className="bookmark-chapter">{bm.chapterTitle}</span>
                                                    <span className="bookmark-page">Страница {bm.pageNumber}</span>
                                                </div>
                                            </button>
                                            <button
                                                className="icon-btn icon-btn-sm danger"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeBookmark(bm.chapterId, bm.pageId);
                                                }}
                                                title="Удалить закладку"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="sidebar-footer">
                    <button className="btn btn-ghost" onClick={() => { navigate('/'); closeSidebar(); }}>
                        <BookOpen size={16} />
                        <span>К содержанию</span>
                    </button>

                    {/* User block */}
                    {isLoggedIn && user ? (
                        <div className="sidebar-user">
                            {user.photoUrl ? (
                                <img
                                    src={user.photoUrl}
                                    alt={displayName ?? 'Аватар'}
                                    className="sidebar-user-avatar"
                                />
                            ) : (
                                <div className="sidebar-user-avatar sidebar-user-avatar-placeholder">
                                    {(displayName ?? '?')[0].toUpperCase()}
                                </div>
                            )}
                            <div className="sidebar-user-info">
                                <span className="sidebar-user-name">{displayName}</span>
                                {user.email && (
                                    <span className="sidebar-user-email">{user.email}</span>
                                )}
                            </div>
                            <button
                                className="icon-btn icon-btn-sm danger"
                                onClick={handleLogout}
                                title="Выйти"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    ) : (
                        <button
                            className="btn btn-auth-hint"
                            onClick={onLoginClick}
                            id="sidebar-login-btn"
                        >
                            <LogIn size={16} />
                            <span>Войти</span>
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
}
