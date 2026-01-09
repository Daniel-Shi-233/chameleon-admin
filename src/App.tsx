import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TemplateList from './pages/TemplateList';
import TemplateEdit from './pages/TemplateEdit';
import UserList from './pages/UserList';
import JobList from './pages/JobList';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/templates" element={<TemplateList />} />
        <Route path="/templates/new" element={<TemplateEdit />} />
        <Route path="/templates/:id" element={<TemplateEdit />} />
        <Route path="/users" element={<UserList />} />
        <Route path="/jobs" element={<JobList />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
