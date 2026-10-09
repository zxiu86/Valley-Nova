import { Routes } from '@angular/router';
import { NovelLibrary } from './components/novel-library';
import { NovelReader } from './components/novel-reader';
import { NovelEditor } from './components/novel-editor';
import { NovelDetails } from './components/novel-details';
import { AuthPage } from './components/auth-page';
import { UserProfile } from './components/user-profile';

export const routes: Routes = [
  { path: '', component: NovelLibrary },
  { path: 'library', component: NovelLibrary },
  { path: 'novel/:id', component: NovelDetails },
  { path: 'details/:id', component: NovelDetails },
  { path: 'details', component: NovelDetails },
  { path: 'reader', component: NovelReader },
  { path: 'reader/:novelId', component: NovelReader },
  { path: 'reader/:novelId/:chapterId', component: NovelReader },
  { path: 'login', component: AuthPage },
  { path: 'register', component: AuthPage },
  { path: 'auth', component: AuthPage },
  { path: 'profile', component: UserProfile },
  { path: 'editor', component: NovelEditor },
  { path: '**', redirectTo: '' },
];
