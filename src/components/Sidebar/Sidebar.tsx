import './Sidebar.css';
import { useNavigate } from 'react-router-dom';
import { useBook } from '../../context/BookContext';
import { useAuth } from '../../context/AuthContext';
import { chapters } from '../../data/chapters';
import {
    X,
    BookOpen,
    Bookmark as BookmarkIcon,
    Trash2,
    ChevronRight,
    LogIn,
    LogOut,
    Lock,
    RefreshCw,
    UserPlus,
} from 'lucide-react';
import LogoutModal from '../auth/LogoutModal/LogoutModal';
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
    const { user, isLoggedIn, activeProvider, availableProviders, switchProvider } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('chapters');
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);

    function navigateTo(chapterId: string, pageId: string) {
        navigate(`/chapter/${chapterId}/page/${pageId}`);
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
        ? (user.firstName
            ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
            : user.username ?? user.email ?? 'Читатель')
        : null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`}
                onClick={closeSidebar}
                aria-hidden="true"
            />

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} aria-label="Навигация по книге">
                {/* Header */}
                <div className="sidebar-header">
                    <span className="sidebar-title">Меню</span>
                    <button
                        className="icon-btn icon-btn-sm"
                        onClick={closeSidebar}
                        aria-label="Закрыть меню"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="sidebar-tabs" role="tablist">
                    <button
                        role="tab"
                        aria-selected={activeTab === 'chapters'}
                        className={`sidebar-tab ${activeTab === 'chapters' ? 'active' : ''}`}
                        onClick={() => setActiveTab('chapters')}
                    >
                        <BookOpen size={16} />
                        <span>Главы</span>
                    </button>
                    <button
                        role="tab"
                        aria-selected={activeTab === 'bookmarks'}
                        className={`sidebar-tab ${activeTab === 'bookmarks' ? 'active' : ''}`}
                        onClick={handleBookmarksTabClick}
                    >
                        <BookmarkIcon size={16} />
                        <span>Закладки</span>
                        {bookmarks.length > 0 && (
                            <span className="badge">{bookmarks.length}</span>
                        )}
                        {!isLoggedIn && (
                            <Lock size={12} className="sidebar-tab-lock" />
                        )}
                    </button>
                </div>

                {/* Syncing indicator */}
                {isSyncing && (
                    <div className="sidebar-syncing">
                        <div className="spinner spinner-sm" />
                        <span>Синхронизация...</span>
                    </div>
                )}

                {/* Tab Content */}
                <div className="sidebar-content">
                    {activeTab === 'chapters' && (
                        <ul className="chapter-list">
                            {chapters.map((ch, idx) => {
                                const isCurrent = currentPosition.chapterId === ch.id;
                                const progress = getChapterProgress(ch.id);

                                return (
                                    <li key={ch.id} className="chapter-item">
                                        <button
                                            className={`chapter-link ${isCurrent ? 'active' : ''}`}
                                            onClick={() => navigateTo(ch.id, ch.pages[0].id)}
                                        >
                                            <div className="chapter-number-badge">
                                                {idx + 1}
                                            </div>
                                            <div className="chapter-info">
                                                <span className="chapter-name">{ch.title}</span>
                                                <span className="chapter-subtitle">{ch.subtitle}</span>
                                                {progress > 0 && (
                                                    <div className="chapter-progress-bar">
                                                        <div
                                                            className="chapter-progress-fill"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <ChevronRight size={16} className="chapter-arrow" />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {activeTab === 'bookmarks' && (
                        <>
                            {bookmarks.length === 0 ? (
                                <div className="empty-state">
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
                        <div className="sidebar-user-container">
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
                                    {activeProvider && (
                                        <span className="account-provider-tag">
                                            {activeProvider === 'google' ? '🔵 Google' : '✈️ Telegram'}
                                        </span>
                                    )}
                                </div>
                                <button
                                    className="icon-btn icon-btn-sm danger"
                                    onClick={() => setLogoutModalOpen(true)}
                                    title="Выйти"
                                >
                                    <LogOut size={16} />
                                </button>
                            </div>

                            {availableProviders.length > 1 ? (
                                <button
                                    className="switch-account-btn"
                                    onClick={() => switchProvider(activeProvider === 'google' ? 'telegram' : 'google')}
                                    title={activeProvider === 'google' ? 'Переключить на Telegram' : 'Переключить на Google'}
                                >
                                    <RefreshCw size={13} />
                                    <span>{activeProvider === 'google' ? '✈️ На Telegram' : '🔵 На Google'}</span>
                                </button>
                            ) : availableProviders.length === 1 && (
                                <button
                                    className="switch-account-btn add-account-btn"
                                    onClick={() => setLogoutModalOpen(true)}
                                    title={activeProvider === 'google' ? 'Войти через Telegram' : 'Войти через Google'}
                                >
                                    <UserPlus size={13} />
                                    <span>{activeProvider === 'google' ? '+ ✈️ Войти в TG' : '+ 🔵 Войти в Google'}</span>
                                </button>
                            )}
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

            {/* Logout Modal */}
            <LogoutModal
                isOpen={logoutModalOpen}
                onClose={() => setLogoutModalOpen(false)}
            />
        </>
    );
}
