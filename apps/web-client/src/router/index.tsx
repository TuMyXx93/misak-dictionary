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
const AdminMediaPage = lazy(
  () =>
    import('@/pages/admin/AdminMediaPage').then((m) => ({
      default: m.AdminMediaPage,
    })) as Promise<{ default: React.ComponentType<object> }>,
);
const CambiarPasswordPage = lazy(
  () =>
    import('@/pages/admin/CambiarPasswordPage').then((m) => ({
      default: m.CambiarPasswordPage,
    })) as Promise<{ default: React.ComponentType<object> }>,
);

import { PERMISSIONS } from '@/shared/permissions';
import { firstAllowedRoute, useAuthStore } from '@/stores/authStore';

const AdminIndexRedirect = () => {
  const { user } = useAuthStore();
  return <Navigate to={firstAllowedRoute(user)} replace />;
};

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
        { index: true, element: <AdminIndexRedirect /> },
        {
          path: 'cambiar-password',
          element: <CambiarPasswordPage />,
        },
        {
          path: 'sentidos',
          element: (
            <RequirePermission permission={PERMISSIONS.DICCIONARIO_LEER}>
              <SentidosPage />
            </RequirePermission>
          ),
        },
        {
          path: 'sentidos/nuevo',
          element: (
            <RequirePermission permission={PERMISSIONS.DICCIONARIO_ESCRIBIR}>
              <SentidoEditorPage />
            </RequirePermission>
          ),
        },
        {
          path: 'sentidos/:id/editar',
          element: (
            <RequirePermission permission={PERMISSIONS.DICCIONARIO_ESCRIBIR}>
              <SentidoEditorPage />
            </RequirePermission>
          ),
        },
        {
          path: 'medios',
          element: (
            <RequirePermission permission={PERMISSIONS.MEDIOS_LEER}>
              <AdminMediaPage />
            </RequirePermission>
          ),
        },
        {
          path: 'revision',
          element: (
            <RequirePermission permission={PERMISSIONS.TAXONOMIA_RATIFICAR}>
              <RevisionPage />
            </RequirePermission>
          ),
        },
        {
          path: 'dashboard',
          element: (
            <RequirePermission permission={PERMISSIONS.AUDITORIA_LEER}>
              <DashboardPage />
            </RequirePermission>
          ),
        },
        {
          path: 'papelera',
          element: (
            <RequirePermission permission={PERMISSIONS.DICCIONARIO_BORRAR}>
              <PapeleraPage />
            </RequirePermission>
          ),
        },
        {
          path: 'usuarios',
          element: (
            <RequirePermission permission={PERMISSIONS.USUARIOS_GESTIONAR}>
              <UsuariosPage />
            </RequirePermission>
          ),
        },
        {
          path: 'auditoria',
          element: (
            <RequirePermission permission={PERMISSIONS.AUDITORIA_LEER}>
              <AuditoriaPage />
            </RequirePermission>
          ),
        },
        {
          path: 'ajustes',
          element: (
            <RequirePermission permission={PERMISSIONS.AJUSTES_GESTIONAR}>
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
