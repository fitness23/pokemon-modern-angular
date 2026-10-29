import { Routes } from '@angular/router';

const loadSearch = () => import('./search/search.component').then(m => m.SearchComponent);

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: loadSearch },
  { path: 'search', loadComponent: loadSearch },
  { path: 'fire', loadComponent: () => import('./fire/fire.component').then(m => m.FireComponent) },
  { path: 'water', loadComponent: () => import('./water/water.component').then(m => m.WaterComponent) },
];
