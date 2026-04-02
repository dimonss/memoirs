import { useNavigate } from 'react-router-dom';
import { useBook } from '../context/BookContext';
import { chapters } from '../data/chapters';
import {
    X,
    BookOpen,
    Bookmark as BookmarkIcon,
    Trash2,
    ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

type Tab = 'chapters' | 'bookmarks';

export default function Sidebar() {
    const navigate = useNavigate();
    const {
        sidebarOpen,
        closeSidebar,
        bookmarks,
        removeBookmark,
        currentPosition,
        getChapterProgress,
    } = useBook();
    const [activeTab, setActiveTab] = useState<Tab>('chapters');

    function navigateTo(chapterId: string, pageId: string) {
        navigate(`/chapter/${chapterId}/page/${pageId}`);
        closeSidebar();
    }

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
                        onClick={() => setActiveTab('bookmarks')}
                    >
                        <BookmarkIcon size={16} />
                        <span>Закладки</span>
                        {bookmarks.length > 0 && (
                            <span className="badge">{bookmarks.length}</span>
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

                    {activeTab === 'bookmarks' && (
                        <>
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
                </div>
            </aside>
        </>
    );
}
