import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home-page').then((m) => m.HomePage),
    title: 'أروقة الخلود | منصة القراءة والأدب العربي الرفيع',
  },
  {
    path: 'details',
    loadComponent: () => import('./pages/details/details-page').then((m) => m.DetailsPage),
    title: 'أروقة الخلود | تفاصيل السفر ومصادر النص',
  },
  {
    path: 'explore',
    loadComponent: () => import('./pages/explore/explore-page').then((m) => m.ExplorePage),
    title: 'أروقة الخلود | خزانة الاستكشاف والبحث',
  },
  {
    path: 'reading',
    loadComponent: () => import('./pages/reading/reading-page').then((m) => m.ReadingPage),
    title: 'أروقة الخلود | محراب القراءة الصافية',
  },
  {
    path: 'auth',
    loadComponent: () => import('./pages/auth/auth-page').then((m) => m.AuthPage),
    title: 'أروقة الخلود | بوابة العضوية والعبور',
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile-page').then((m) => m.ProfilePage),
    title: 'أروقة الخلود | ديوان القارئ والباحث',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
