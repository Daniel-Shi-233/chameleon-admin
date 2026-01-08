import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import TemplateList from './pages/TemplateList';
import TemplateEdit from './pages/TemplateEdit';
import UserList from './pages/UserList';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/templates" element={<TemplateList />} />
        <Route path="/templates/new" element={<TemplateEdit />} />
        <Route path="/templates/:id" element={<TemplateEdit />} />
        <Route path="/users" element={<UserList />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
