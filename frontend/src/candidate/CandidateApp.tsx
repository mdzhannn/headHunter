import { Navigate, Route, Routes } from 'react-router-dom';
import CandidateLoginPage from './CandidateLoginPage';
import CandidateProtectedLayout from './CandidateProtectedLayout';
import CandidateVacanciesPage from './CandidateVacanciesPage';
import CandidateMessagesPage from './CandidateMessagesPage';
import CandidateChatPage from './CandidateChatPage';
import CandidateLandingPage from './CandidateLandingPage';
import CandidateProfilePage from './CandidateProfilePage';
import CandidateRegisterPage from './CandidateRegisterPage';
import CandidateSignupPage from './CandidateSignupPage';
import CandidateForgotPasswordPage from './CandidateForgotPasswordPage';

export default function CandidateApp() {
  return (
    <Routes>
      <Route path="login" element={<CandidateLoginPage />} />
      <Route path="signup" element={<CandidateSignupPage />} />
      <Route path="forgot-password" element={<CandidateForgotPasswordPage />} />
      <Route index element={<CandidateLandingPage />} />
      <Route path="vacancies" element={<CandidateVacanciesPage />} />
      <Route path="register" element={<CandidateRegisterPage />} />
      <Route element={<CandidateProtectedLayout />}>
        <Route path="cabinet" element={<Navigate to="/app/profile" replace />} />
        <Route path="resume" element={<Navigate to="/app/profile" replace />} />
        <Route path="profile" element={<CandidateProfilePage />} />
        <Route path="messages" element={<CandidateMessagesPage />} />
        <Route path="messages/:id" element={<CandidateChatPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
