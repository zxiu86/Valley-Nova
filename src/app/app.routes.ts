import { Routes } from '@angular/router';
import { NovelLibrary } from './components/novel-library';
import { NovelReader } from './components/novel-reader';
import { NovelEditor } from './components/novel-editor';
import { MtxLab } from './components/mtx-lab';

export const routes: Routes = [
  { path: '', redirectTo: 'library', pathMatch: 'full' },
  { path: 'library', component: NovelLibrary },
  { path: 'reader', component: NovelReader },
  { path: 'editor', component: NovelEditor },
  { path: 'lab', component: MtxLab },
  { path: '**', redirectTo: 'library' },
];
