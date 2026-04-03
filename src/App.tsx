import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BookProvider } from './context/BookContext';
import Sidebar from './components/Sidebar';

const Reader = lazy(() => import('./components/Reader'));
const TableOfContents = lazy(() => import('./components/TableOfContents'));

function App() {
  return (
    <BrowserRouter basename={"/memoirs"}>
      <BookProvider>
        <div className="app">
          <Sidebar />
          <div className="app-main">
            <Suspense fallback={<div className="loading-fallback"><div className="spinner"></div>Загрузка...</div>}>
              <Routes>
                <Route path="/" element={<TableOfContents />} />
                <Route path="/chapter/:chapterId/page/:pageId" element={<Reader />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
        </div>
      </BookProvider>
    </BrowserRouter>
  );
}

export default App;
