import { Route, Routes } from 'react-router-dom';
import AdminApp from './AdminApp';
import { AuthProvider } from './candidate/AuthContext';
import CandidateApp from './candidate/CandidateApp';
import EmployerPortalPage from './employer/EmployerPortalPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/app/*" element={<CandidateApp />} />
        <Route path="/employer" element={<EmployerPortalPage />} />
        <Route path="/*" element={<AdminApp />} />
      </Routes>
    </AuthProvider>
  );
}
