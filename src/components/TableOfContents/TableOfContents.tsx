import './TableOfContents.css';
import { useNavigate } from 'react-router-dom';
import { useBook } from '../../context/BookContext';
import { chapters, getTotalPages } from '../../data/chapters';
import { BookOpen, Bookmark, ArrowRight, LogIn, Lock, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import LogoutModal from '../auth/LogoutModal/LogoutModal';
import BookmarksModal from '../BookmarksModal/BookmarksModal';

export default function TableOfContents() {
    const navigate = useNavigate();
    const { currentPosition, getChapterProgress, bookmarks } = useBook();
    const { isLoggedIn, openLoginModal, logout } = useAuth();
    const [logoutModalOpen, setLogoutModalOpen] = useState(false);
    const [bookmarksModalOpen, setBookmarksModalOpen] = useState(false);

    const totalPages = getTotalPages();
    const hasLastPosition = currentPosition.chapterId && currentPosition.pageId;

    function continueReading() {
        navigate(`/chapter/${currentPosition.chapterId}/page/${currentPosition.pageId}`);
    }

    return (
        <div className="toc">
            {/* Hero */}
            <header className="toc-hero">
                <div className="toc-hero-ornament" />
                <h1 className="toc-title">Мемуары</h1>
                <p className="toc-subtitle">Записки о прожитых днях</p>
                <div className="toc-stats">
                    <div className="toc-stat">
                        <BookOpen size={18} />
                        <span>{chapters.length} глав</span>
                    </div>
                    <div className="toc-stat-divider" />
                    <div className="toc-stat">
                        <span>{totalPages} страниц</span>
                    </div>
                    <div className="toc-stat-divider" />
                    {!isLoggedIn ? (
                        <button
                            className="toc-stat toc-stat-btn"
                            onClick={openLoginModal}
                            title="Войдите, чтобы использовать закладки"
                        >
                            <Lock size={12} className="toc-stat-lock" />
                            <Bookmark size={18} />
                            <span>Закладки</span>
                        </button>
                    ) : (
                        <button
                            className="toc-stat toc-stat-btn"
                            onClick={() => setBookmarksModalOpen(true)}
                            title="Открыть закладки"
                        >
                            <Bookmark size={18} />
                            <span>{bookmarks.length} закладок</span>
                        </button>
                    )}
                </div>

                <div className="toc-actions">
                    {hasLastPosition && (
                        <button className="btn btn-primary btn-lg toc-continue" onClick={continueReading}>
                            <span>Продолжить чтение</span>
                            <ArrowRight size={18} />
                        </button>
                    )}

                    {!isLoggedIn && (
                        <button className="btn btn-auth-hint" onClick={openLoginModal}>
                            <LogIn size={18} />
                            <span>Войти</span>
                        </button>
                    )}
                </div>
            </header>

            {/* Chapter grid */}
            <section className="toc-chapters">
                <h2 className="toc-section-title">Содержание</h2>
                <div className="toc-grid">
                    {chapters.map(ch => {
                        const progress = getChapterProgress(ch.id);
                        const isCurrent = currentPosition.chapterId === ch.id;
                        return (
                            <button
                                key={ch.id}
                                className={`toc-card ${isCurrent ? 'current' : ''}`}
                                onClick={() => navigate(`/chapter/${ch.id}/page/${ch.pages[0].id}`)}
                            >
                                <div className="toc-card-number">
                                    <span>{ch.number}</span>
                                </div>
                                <div className="toc-card-body">
                                    <h3 className="toc-card-title">{ch.title}</h3>
                                    <p className="toc-card-subtitle">{ch.subtitle}</p>
                                    <div className="toc-card-meta">
                                        <span>{ch.pages.length} стр.</span>
                                        {progress > 0 && (
                                            <span className="toc-card-progress">{progress}% прочитано</span>
                                        )}
                                    </div>
                                </div>
                                <div className="toc-card-progress-ring">
                                    <svg viewBox="0 0 36 36" className="progress-ring">
                                        <path
                                            className="progress-ring-bg"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <path
                                            className="progress-ring-fill"
                                            strokeDasharray={`${progress}, 100`}
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                    </svg>
                                </div>
                                <ArrowRight size={18} className="toc-card-arrow" />
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Logout button at the very bottom, subtle */}
            {isLoggedIn && (
                <div className="toc-footer">
                    <button className="toc-stat-btn toc-footer-logout" onClick={() => setLogoutModalOpen(true)}>
                        <LogOut size={14} />
                        <span>Выйти из аккаунта</span>
                    </button>
                </div>
            )}

            <LogoutModal
                isOpen={logoutModalOpen}
                onClose={() => setLogoutModalOpen(false)}
                onConfirm={async () => {
                    setLogoutModalOpen(false);
                    await logout();
                }}
            />
            <BookmarksModal
                isOpen={bookmarksModalOpen}
                onClose={() => setBookmarksModalOpen(false)}
            />
        </div>
    );
}
