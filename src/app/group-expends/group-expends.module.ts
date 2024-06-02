import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GroupExpendsRoutingModule } from './group-expends-routing.module';
import { MatCardModule } from '@angular/material/card';
import { GroupsComponent } from './components/groups/groups.component';
import { GroupSpendComponent } from './components/group-spend/group-spend.component';
import { DBConfig, NgxIndexedDBModule } from 'ngx-indexed-db';
import { GroupExpensesService } from './services/group-expenses.service';
import {MatDialogModule} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import {MatChipsModule} from '@angular/material/chips';
import {MatIconModule} from '@angular/material/icon';
import { NgxSpinnerModule } from "ngx-spinner";



const dbConfig: DBConfig = {
  name: 'MyDb',
  version: 1,
  objectStoresMeta: [{
    store: 'groupTable',
    storeConfig: { keyPath: 'id', autoIncrement: true },
    storeSchema: [
      { name: 'name', keypath: 'name', options: { unique: true } }
    ]
  },
  {
    store: 'ParticipantsTable',
    storeConfig: { keyPath: 'id', autoIncrement: true, },
    storeSchema: [
      { name: 'groupId', keypath: 'groupId', options: { unique: false } },
      { name: 'name', keypath: 'name', options: { unique: false } }
    ],
  },
  {
    store: 'ExpensesTable',
    storeConfig: { keyPath: 'id', autoIncrement: true, },
    storeSchema: [
      { name: 'groupId', keypath: 'groupId', options: { unique: false } },
      { name: 'description', keypath: 'description', options: { unique: false } },
      { name: 'amount', keypath: 'amount', options: { unique: false } },
      { name: 'whoPaid', keypath: 'whoPaid', options: { unique: false } },
      { name: 'whoPaidName', keypath: 'whoPaidName', options: { unique: false } },
    ],
  },
  {
    store: 'ParticipantExpenseTable',
    storeConfig: { keyPath: 'id', autoIncrement: true, },
    storeSchema: [
      { name: 'groupId', keypath: 'groupId', options: { unique: false } },
      { name: 'expences_id', keypath: 'expences_id', options: { unique: false } },
      { name: 'participant_id', keypath: 'participant_id', options: { unique: false } },
      { name: 'participantName', keypath: 'participantName', options: {unique: false}}
    ],
  }]
};

@NgModule({
  declarations: [
    GroupsComponent,
    GroupSpendComponent
  ],
  imports: [
    CommonModule,
    GroupExpendsRoutingModule,
    MatCardModule,
    MatDialogModule,
    MatButtonModule,
    NgxIndexedDBModule.forRoot(dbConfig),
    ReactiveFormsModule,
    MatChipsModule,
    MatIconModule,
    NgxSpinnerModule.forRoot({ type: 'ball-scale-multiple' }),
  ],
  providers: [
    GroupExpensesService
  ]
})
export class GroupExpendsModule { }
