import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home-page').then((m) => m.HomePage),
    data: { titleKey: 'novels' },
  },
  {
    path: 'details',
    loadComponent: () => import('./pages/details/details-page').then((m) => m.DetailsPage),
    data: { titleKey: 'details' },
  },
  {
    path: 'explore',
    loadComponent: () => import('./pages/explore/explore-page').then((m) => m.ExplorePage),
    data: { titleKey: 'explore' },
  },
  {
    path: 'reading',
    loadComponent: () => import('./pages/reading/reading-page').then((m) => m.ReadingPage),
    data: { titleKey: 'reader' },
  },
  {
    path: 'auth',
    loadComponent: () => import('./pages/auth/auth-page').then((m) => m.AuthPage),
    data: { titleKey: 'auth' },
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile-page').then((m) => m.ProfilePage),
    data: { titleKey: 'profile' },
  },
  {
    path: 'profile/:username',
    loadComponent: () => import('./pages/profile/profile-page').then((m) => m.ProfilePage),
    data: { titleKey: 'profile' },
  },
  {
    path: '**',
    redirectTo: '',
  },
];

