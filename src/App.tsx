import { Suspense, lazy, useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BookProvider } from './context/BookContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar/Sidebar';
import LoginModal from './components/auth/LoginModal/LoginModal';

const Reader = lazy(() => import('./components/Reader/Reader'));
const TableOfContents = lazy(() => import('./components/TableOfContents/TableOfContents'));

/* ------------------------------------------------------------------ */
/*  Inner app — needs access to AuthContext                            */
/* ------------------------------------------------------------------ */

function AppInner() {
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const { setOpenLoginModal, isLoading } = useAuth();

    const openLoginModal = useCallback(() => setLoginModalOpen(true), []);
    const closeLoginModal = useCallback(() => setLoginModalOpen(false), []);

    // Register the opener so any component can trigger the modal
    useEffect(() => {
        setOpenLoginModal(openLoginModal);
    }, [setOpenLoginModal, openLoginModal]);

    if (isLoading) {
        return (
            <div className="loading-fallback">
                <div className="spinner" />
                Загрузка...
            </div>
        );
    }

    return (
        <BookProvider onAuthRequired={openLoginModal}>
            <div className="app">
                <Sidebar onLoginClick={openLoginModal} />
                <div className="app-main">
                    <Suspense fallback={<div className="loading-fallback"><div className="spinner" />Загрузка...</div>}>
                        <Routes>
                            <Route path="/" element={<TableOfContents />} />
                            <Route path="/chapter/:chapterId/page/:pageId" element={<Reader />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Suspense>
                </div>
            </div>

            <LoginModal isOpen={loginModalOpen} onClose={closeLoginModal} />
        </BookProvider>
    );
}

/* ------------------------------------------------------------------ */
/*  Root app                                                           */
/* ------------------------------------------------------------------ */

function App() {
    const basename = import.meta.env.DEV ? "/dev" : "/memoirs";
    return (
        <BrowserRouter basename={basename}>
            <AuthProvider>
                <AppInner />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
