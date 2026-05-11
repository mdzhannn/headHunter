import { Route, Routes } from 'react-router-dom';
import AdminApp from './AdminApp';
import { AuthProvider } from './candidate/AuthContext';
import CandidateApp from './candidate/CandidateApp';
import EmployerPortalPage from './employer/EmployerPortalPage';

export default function App() {
  return (
    <Routes>
      <Route path="/app/*" element={<AuthProvider><CandidateApp /></AuthProvider>} />
      <Route path="/employer" element={<EmployerPortalPage />} />
      <Route path="/*" element={<AdminApp />} />
    </Routes>
  );
}
