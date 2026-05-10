import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import KanbanPage from './pages/KanbanPage';
import TaskDetailPage from './pages/TaskDetailPage';
import DashboardPage from './pages/DashboardPage';
import DevelopersPage from './pages/DevelopersPage';
import LoginPage from './pages/LoginPage';
import DocumentsPage from './pages/DocumentsPage';
import DocumentEditorPage from './pages/DocumentEditorPage';
import TeamsPage from './pages/TeamsPage';
import TeamDetailPage from './pages/TeamDetailPage';
import MeetingsPage from './pages/MeetingsPage';
import PortfolioPage from './pages/PortfolioPage';
import GanttPage from './pages/GanttPage';
import CalendarPage from './pages/CalendarPage';
import RisksPage from './pages/RisksPage';
import MilestonesPage from './pages/MilestonesPage';
import NotificationsPage from './pages/NotificationsPage';
import PlanningPokerPage from './pages/PlanningPokerPage';
import ResourcesPage from './pages/ResourcesPage';
import TestPlansPage from './pages/TestPlansPage';
import MetricsDashboardPage from './pages/MetricsDashboardPage';
import CommandPalette from './components/ui/CommandPalette';

function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative">
        <Outlet />
      </main>
      <CommandPalette />
    </div>
  );
}

function AppContent() {
  const { loadDevelopers } = useApp();
  const { user } = useAuth();

  useEffect(() => {
    if (user) loadDevelopers();
  }, [loadDevelopers, user]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/projects/:id/dashboard" element={<DashboardPage />} />
        <Route path="/projects/:id/kanban" element={<KanbanPage />} />
        <Route path="/projects/:id/gantt" element={<GanttPage />} />
        <Route path="/projects/:id/calendar" element={<CalendarPage />} />
        <Route path="/projects/:id/risks" element={<RisksPage />} />
        <Route path="/projects/:id/milestones" element={<MilestonesPage />} />
        <Route path="/projects/:id/poker" element={<PlanningPokerPage />} />
        <Route path="/tasks/:id" element={<TaskDetailPage />} />
        <Route path="/developers" element={<DevelopersPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/documents/new" element={<DocumentEditorPage />} />
        <Route path="/documents/edit/:id" element={<DocumentEditorPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/teams/:id" element={<TeamDetailPage />} />
        <Route path="/meetings" element={<MeetingsPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/test-plans" element={<TestPlansPage />} />
        <Route path="/risks" element={<RisksPage />} />
        <Route path="/milestones" element={<MilestonesPage />} />
        <Route path="/metrics" element={<MetricsDashboardPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
