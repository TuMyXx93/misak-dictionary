/**
 * Router — Phase 2 & Phase 4 (Admin Panel)
 * Spec 006 (R-001, R-004, R-023, T-051)
 *
 * Uses createBrowserRouter (RR7 data router API) with React.lazy for code splitting
 * and isolation of the admin chunk (R-023).
 */

import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { RequireAuth } from '@/components/admin/RequireAuth';
import { RequirePermission } from '@/components/admin/RequirePermission';

// Public pages
const Home = lazy(
  () =>
    import('@pages/Home').then((m) => ({ default: m.Home })) as Promise<{
      default: React.ComponentType<object>;
    }>,
);
const CamposIndex = lazy(
  () =>
    import('@pages/CamposIndex').then((m) => ({
      default: m.CamposIndex,
    })) as Promise<{ default: React.ComponentType<object> }>,
);
const CampoPage = lazy(
  () =>
    import('@pages/CampoPage').then((m) => ({
      default: m.CampoPage,
    })) as Promise<{ default: React.ComponentType<object> }>,
);
const SubfieldPage = lazy(
  () =>
    import('@pages/SubfieldPage').then((m) => ({
      default: m.SubfieldPage,
    })) as Promise<{ default: React.ComponentType<object> }>,
);
const MicrofieldPage = lazy(
  () =>
    import('@pages/MicrofieldPage').then((m) => ({
      default: m.MicrofieldPage,
    })) as Promise<{ default: React.ComponentType<object> }>,
);
const NotFound = lazy(
  () =>
    import('@pages/NotFound').then((m) => ({
      default: m.NotFound,
    })) as Promise<{ default: React.ComponentType<object> }>,
);

// Admin pages (lazy-loaded inside chunk 'admin' - R-023)
const LoginPage = lazy(
  () =>
    import('@/pages/admin/LoginPage').then((m) => ({
      default: m.LoginPage,
    })) as Promise<{ default: React.ComponentType<object> }>,
);
const SentidosPage = lazy(
  () =>
    import('@/pages/admin/SentidosPage').then((m) => ({
      default: m.SentidosPage,
    })) as Promise<{ default: React.ComponentType<object> }>,
);
const SentidoEditorPage = lazy(
  () =>
    import('@/pages/admin/SentidoEditorPage').then((m) => ({
      default: m.SentidoEditorPage,
    })) as Promise<{ default: React.ComponentType<object> }>,
);
const RevisionPage = lazy(
  () =>
    import('@/pages/admin/RevisionPage').then((m) => ({
      default: m.RevisionPage,
    })) as Promise<{ default: React.ComponentType<object> }>,
);
const DashboardPage = lazy(
  () =>
    import('@/pages/admin/DashboardPage').then((m) => ({
      default: m.DashboardPage,
    })) as Promise<{ default: React.ComponentType<object> }>,
);
const PapeleraPage = lazy(
  () =>
    import('@/pages/admin/PapeleraPage').then((m) => ({
      default: m.PapeleraPage,
    })) as Promise<{ default: React.ComponentType<object> }>,
);
const UsuariosPage = lazy(
  () =>
    import('@/pages/admin/UsuariosPage').then((m) => ({
      default: m.UsuariosPage,
    })) as Promise<{ default: React.ComponentType<object> }>,
);
const AuditoriaPage = lazy(
  () =>
    import('@/pages/admin/AuditoriaPage').then((m) => ({
      default: m.AuditoriaPage,
    })) as Promise<{ default: React.ComponentType<object> }>,
);
const AjustesPage = lazy(
  () =>
    import('@/pages/admin/AjustesPage').then((m) => ({
      default: m.AjustesPage,
    })) as Promise<{ default: React.ComponentType<object> }>,
);

export const router = createBrowserRouter(
  [
    // Public routes
    { path: '/', element: <Home /> },
    { path: '/campos', element: <CamposIndex /> },
    { path: '/campos/:fieldSlug', element: <CampoPage /> },
    { path: '/campos/:fieldSlug/:subfieldSlug', element: <SubfieldPage /> },
    {
      path: '/campos/:fieldSlug/:subfieldSlug/:microfieldSlug',
      element: <MicrofieldPage />,
    },

    // Admin login (public inside admin space)
    { path: '/admin/login', element: <LoginPage /> },

    // Protected Admin Panel routes (R-001, R-004)
    {
      path: '/admin',
      element: (
        <RequireAuth>
          <AdminLayout />
        </RequireAuth>
      ),
      children: [
        { index: true, element: <Navigate to="/admin/sentidos" replace /> },
        {
          path: 'sentidos',
          element: (
            <RequirePermission permission="taxonomy:read">
              <SentidosPage />
            </RequirePermission>
          ),
        },
        {
          path: 'sentidos/nuevo',
          element: (
            <RequirePermission permission="taxonomy:write">
              <SentidoEditorPage />
            </RequirePermission>
          ),
        },
        {
          path: 'sentidos/:id/editar',
          element: (
            <RequirePermission permission="taxonomy:write">
              <SentidoEditorPage />
            </RequirePermission>
          ),
        },
        {
          path: 'revision',
          element: (
            <RequirePermission permission="taxonomy:ratify">
              <RevisionPage />
            </RequirePermission>
          ),
        },
        {
          path: 'dashboard',
          element: (
            <RequirePermission permission="analytics:read">
              <DashboardPage />
            </RequirePermission>
          ),
        },
        {
          path: 'papelera',
          element: (
            <RequirePermission permission="taxonomy:delete">
              <PapeleraPage />
            </RequirePermission>
          ),
        },
        {
          path: 'usuarios',
          element: (
            <RequirePermission permission="system:users:manage">
              <UsuariosPage />
            </RequirePermission>
          ),
        },
        {
          path: 'auditoria',
          element: (
            <RequirePermission permission="system:audit:read">
              <AuditoriaPage />
            </RequirePermission>
          ),
        },
        {
          path: 'ajustes',
          element: (
            <RequirePermission permission="system:settings:manage">
              <AjustesPage />
            </RequirePermission>
          ),
        },
      ],
    },

    // 404 Fallback
    { path: '*', element: <NotFound /> },
  ],
  { basename: '/' },
);
