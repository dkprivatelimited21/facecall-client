import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import CallPage from './pages/CallPage.jsx';
import ApiDocsPage from './pages/ApiDocsPage.jsx';

export default function App() {
  return (
    <div className="noise">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/room/:roomId" element={<CallPage />} />
        <Route path="/api-docs" element={<ApiDocsPage />} />
      </Routes>
    </div>
  );
}
