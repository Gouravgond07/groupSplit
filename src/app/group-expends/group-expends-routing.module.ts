import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GroupsComponent } from './components/groups/groups.component';
import { GroupSpendComponent } from './components/group-spend/group-spend.component';

const routes: Routes = [
  {path: '', component: GroupsComponent},
  {path: 'group-spends/:groupId', component: GroupSpendComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GroupExpendsRoutingModule { }
