import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PeopleRoutingModule } from './people-routing.module';
import { UsersListComponent } from './staff-management/users-list/users-list.component';
import { EditUserComponent } from './staff-management/edit-user/edit-user.component';
import { AddUserComponent } from './staff-management/add-user/add-user.component';
import { GroupsListComponent } from './staff-management/groups-list/groups-list.component';
import { OrganizationDetailsComponent } from './staff-management/organization-details/organization-details.component';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    UsersListComponent,
    EditUserComponent,
    AddUserComponent,
    GroupsListComponent,
    OrganizationDetailsComponent
  ],
  imports: [
    CommonModule,
    PeopleRoutingModule,
    NgbPaginationModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule
  ]
})
export class PeopleModule { }
