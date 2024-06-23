import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UsersListComponent } from './staff-management/users-list/users-list.component';
import { EditUserComponent } from './staff-management/edit-user/edit-user.component';
import { AddUserComponent } from './staff-management/add-user/add-user.component';
import { GroupsListComponent } from './staff-management/groups-list/groups-list.component';
import { OrganizationDetailsComponent } from './staff-management/organization-details/organization-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: 'users-list', component: UsersListComponent },
      // { path: 'edit-user/:id', component: EditUserComponent },
      { path: 'add-user', component: AddUserComponent },
      { path: 'groups-list', component: GroupsListComponent },
      { path: 'organization-details', component: OrganizationDetailsComponent },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PeopleRoutingModule { }
