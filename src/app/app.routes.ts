import { Routes } from '@angular/router';

export const routes: Routes = [
    {path: '', loadChildren: () => import('./group-expends/group-expends.module').then(x => x.GroupExpendsModule)}
];
