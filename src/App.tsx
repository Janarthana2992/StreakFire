import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { Toaster } from 'sonner';
import { Layout } from './components/Layout';
import { Dialogs } from './components/dialogs/Dialogs';
import { CommandPalette } from './components/CommandPalette';
import { FocusWidget } from './components/FocusWidget';
import { Gate } from './components/Gate';
import { useReminders, useShortcuts } from './hooks/useGlobal';
import { useResolvedTheme, useThemeSync } from './store/theme';
import Today from './pages/Today';

// Code-split the heavier pages (Insights pulls in Recharts).
const Plan = lazy(() => import('./pages/Plan'));
const Todos = lazy(() => import('./pages/Todos'));
const Notes = lazy(() => import('./pages/Notes'));
const Insights = lazy(() => import('./pages/Insights'));

function Shell() {
  useShortcuts();
  useReminders();
  const theme = useResolvedTheme((s) => s.t);
  return (
    <>
      <Suspense fallback={null}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/today" element={<Today />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="/todos" element={<Todos />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/badges" element={<Insights tab="badges" />} />
            <Route path="*" element={<Navigate to="/today" replace />} />
          </Route>
        </Routes>
      </Suspense>
      <Dialogs />
      <CommandPalette />
      <FocusWidget />
      <Gate />
      <Toaster theme={theme} position="bottom-center" offset={24} mobileOffset={{ bottom: 150 }} toastOptions={{ className: 'sf-toast' }} />
    </>
  );
}

export default function App() {
  useThemeSync();
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
