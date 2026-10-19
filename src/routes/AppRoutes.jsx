import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import HomePage from '../pages/HomePage';
import ExplorePage from '../pages/ExplorePage';
import ReelsPage from '../pages/ReelsPage';
import MessagesPage from '../pages/MessagesPage';
import NotificationsPage from '../pages/NotificationsPage';
import SearchPage from '../pages/search/SearchPage';
import ProfilePage from '../pages/profile/ProfilePage';
import SettingsPage from '../pages/settings/SettingsPage';
import AdminReportsPage from '../pages/admin/AdminReportsPage';
import AdminEmailDashboard from '../pages/admin/AdminEmailDashboard';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import HealthStatusPage from '../pages/HealthStatusPage';
import LoginPage from '../pages/auth/LoginPage';
import SignupPage from '../pages/auth/SignupPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import ProtectedRoute from '../components/common/ProtectedRoute';
import PublicOnlyRoute from '../components/common/PublicOnlyRoute';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Only Auth Routes */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify" element={<SignupPage />} />
        <Route path="/verify-email" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Protected Application Area */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="reels" element={<ReelsPage />} />
          <Route path="reels/:reelId" element={<ReelsPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="messages/:conversationId" element={<MessagesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/me" element={<ProfilePage />} />
          <Route path="profile/:userId" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="admin" element={<AdminDashboardPage />} />
          <Route path="admin/reports" element={<AdminReportsPage />} />
          <Route path="admin/email" element={<AdminEmailDashboard />} />
          <Route path="health" element={<HealthStatusPage />} />
        </Route>
      </Route>

      {/* Global Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
