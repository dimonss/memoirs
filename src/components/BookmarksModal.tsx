import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Bookmark as BookmarkIcon, Trash2 } from 'lucide-react';
import { useBook } from '../context/BookContext';

interface BookmarksModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function BookmarksModal({ isOpen, onClose }: BookmarksModalProps) {
    const navigate = useNavigate();
    const { bookmarks, removeBookmark, isSyncing } = useBook();

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    function handleNavigate(chapterId: string, pageId: string) {
        navigate(`/chapter/${chapterId}/page/${pageId}`);
        onClose();
    }

    return (
        <div
            className="bookmarks-modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            role="dialog"
            aria-modal="true"
            aria-label="Закладки"
        >
            <div className="bookmarks-modal">
                {/* Close button */}
                <button
                    className="login-modal-close icon-btn"
                    onClick={onClose}
                    title="Закрыть"
                    aria-label="Закрыть"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="login-modal-header">
                    <div className="login-modal-icon">
                        <BookmarkIcon size={28} />
                    </div>
                    <h2 className="login-modal-title">Закладки</h2>
                    {bookmarks.length > 0 && (
                        <p className="login-modal-subtitle">
                            {bookmarks.length} {bookmarks.length === 1 ? 'закладка' : bookmarks.length < 5 ? 'закладки' : 'закладок'} сохранено
                        </p>
                    )}
                </div>

                {/* Syncing */}
                {isSyncing && (
                    <div className="sidebar-syncing">
                        <div className="spinner spinner-sm" />
                        <span>Сохраняем...</span>
                    </div>
                )}

                {/* List / Empty */}
                {bookmarks.length === 0 ? (
                    <div className="bookmarks-modal-empty">
                        <BookmarkIcon size={48} strokeWidth={1} />
                        <p>Нет сохранённых закладок</p>
                        <span>Нажмите на иконку закладки при чтении, чтобы сохранить страницу</span>
                    </div>
                ) : (
                    <ul className="bookmarks-modal-list">
                        {bookmarks.map(bm => (
                            <li key={bm.id} className="bookmarks-modal-item">
                                <button
                                    className="bookmarks-modal-link"
                                    onClick={() => handleNavigate(bm.chapterId, bm.pageId)}
                                >
                                    <BookmarkIcon size={16} className="bookmarks-modal-icon" />
                                    <div className="bookmarks-modal-info">
                                        <span className="bookmarks-modal-chapter">{bm.chapterTitle}</span>
                                        <span className="bookmarks-modal-page">Страница {bm.pageNumber}</span>
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
            </div>
        </div>
    );
}
