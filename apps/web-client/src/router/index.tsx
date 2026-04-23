/**
 * Router — Phase 2
 *
 * Uses createBrowserRouter (RR7 data router API) for future loader/action support.
 */

import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

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

export const router = createBrowserRouter(
  [
    { path: '/', element: <Home /> },
    { path: '/campos', element: <CamposIndex /> },
    { path: '/campos/:fieldSlug', element: <CampoPage /> },
    { path: '/campos/:fieldSlug/:subfieldSlug', element: <SubfieldPage /> },
    {
      path: '/campos/:fieldSlug/:subfieldSlug/:microfieldSlug',
      element: <MicrofieldPage />,
    },
    { path: '*', element: <NotFound /> },
  ],
  { basename: '/' },
);
