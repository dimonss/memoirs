import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BookProvider } from './context/BookContext';
import Reader from './components/Reader';
import Sidebar from './components/Sidebar';
import TableOfContents from './components/TableOfContents';

function App() {
  return (
    <BrowserRouter basename={"/memoirs"}>
      <BookProvider>
        <div className="app">
          <Sidebar />
          <div className="app-main">
            <Routes>
              <Route path="/" element={<TableOfContents />} />
              <Route path="/chapter/:chapterId/page/:pageId" element={<Reader />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </BookProvider>
    </BrowserRouter>
  );
}

export default App;
