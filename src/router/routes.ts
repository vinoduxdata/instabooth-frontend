import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    // default route is kiosk frontend
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { standbyMode: false },
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') }, // autodetected as main page (other than subpage)
      { path: 'gallery', component: () => import('pages/GalleryPage.vue') },
      { path: 'gallery/mediaviewer/:id', component: () => import('pages/GalleryDetailPage.vue'), props: { startTimer: false } },
      {
        path: 'itempresenter/:id',
        name: 'itempresenter',
        component: () => import('pages/GalleryDetailPage.vue'),
        props: { startTimer: true, itemPresenterMode: true },
      },
    ],
  },
  {
    // standby-path: used on the same device as the photobooth usually
    // user will (only) interact with this page to stop the slideshow and resume normal photobooth-app use
    path: '/standby',
    meta: { standbyMode: true },
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: 'slideshow/random', component: () => import('pages/SlideshowPage.vue') }],
  },

  {
    // standalone-path: used on secondary devices to display the gallery or a slideshow.
    // there is no back-button displayed in the gallery page so users cannot break out the standalone mode.
    path: '/standalone/gallery',
    component: () => import('layouts/StandaloneLayout.vue'),
    children: [
      { path: '', component: () => import('pages/GalleryPage.vue') }, // autodetected as main page (other than subpage)
      { path: 'mediaviewer/:id', component: () => import('pages/GalleryDetailPage.vue'), props: { startTimer: false } },
    ],
  },
  {
    // standalone-path: used on secondary devices to display the gallery or a slideshow.
    // there is no back-button displayed in the gallery page so users cannot break out the standalone mode.
    path: '/standalone/slideshow',
    component: () => import('layouts/StandaloneLayout.vue'),
    children: [
      { path: '', component: () => import('pages/SlideshowPage.vue') }, // autodetected as main page (other than subpage)
    ],
  },

  {
    // auth layout
    path: '/auth',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      { path: '', redirect: '/auth/login' },
      { path: '/', redirect: '/auth/login' },
      { path: 'login', component: () => import('src/pages/LoginPage.vue') },
    ],
  },

  {
    // extended layout for admins
    path: '/admin',
    meta: { requiresAuth: true, requiresAdmin: true },
    component: () => import('layouts/AdminLayout.vue'),
    children: [
      { path: '', component: () => import('pages/AdminDashboardPage.vue') },
      { path: 'gallery', component: () => import('pages/GalleryPage.vue') },
      { path: 'help', component: () => import('pages/AdminHelpPage.vue') },
      { path: '1ststart', component: () => import('pages/Admin1stStartPage.vue') },
      { path: 'user', component: () => import('pages/AdminUserPage.vue') },
      { path: 'event', component: () => import('pages/AdminEventPage.vue') },
      {
        name: 'event-config',
        path: 'event/:eventId/config/:section?',
        component: () => import('pages/AdminConfigPage.vue'),
        props: (route) => ({ eventId: route.params.eventId }),
      },
      {
        path: 'event/:eventId/files',
        component: () => import('pages/AdminFilesPage.vue'),
        props: (route) => ({ eventId: route.params.eventId }),
      },
      { path: 'event-template', component: () => import('pages/AdminEventTemplatePage.vue') },
      {
        name: 'template-config',
        path: 'event-template/:templateId/config/:section?',
        component: () => import('pages/AdminConfigPage.vue'),
        props: (route) => ({ templateId: route.params.templateId }),
      },
      {
        path: 'event-template/:templateId/files',
        component: () => import('pages/AdminFilesPage.vue'),
        props: (route) => ({ templateId: route.params.templateId }),
      },
      {
        path: 'booth',
        component: () => import('layouts/BoothLayout.vue'),
        children: [
          { path: '', component: () => import('pages/AdminBoothPage.vue') },
          {
            name: 'booth-config',
            path: 'config/:section?',
            component: () => import('pages/AdminConfigPage.vue'),
            props: { boothMode: true },
          },
          { path: 'files', component: () => import('pages/AdminFilesPage.vue') },
          { path: 'multicam', component: () => import('pages/AdminMulticamPage.vue') },
          { path: 'logs', component: () => import('pages/AdminLogsPage.vue') },
        ],
      },
      // legacy redirects
      { path: 'config/:section?', redirect: (to) => ({ name: 'booth-config', params: { section: to.params.section || 'app' } }) },
      { path: 'files', redirect: '/admin/booth/files' },
      { path: 'multicam', redirect: '/admin/booth/multicam' },
      { path: 'logs', redirect: '/admin/booth/logs' },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
