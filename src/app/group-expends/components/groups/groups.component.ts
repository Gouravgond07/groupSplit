
import { Component, OnInit } from '@angular/core';
import { GroupExpensesService, IGroup } from '../../services/group-expenses.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrl: './groups.component.css'
})
export class GroupsComponent implements OnInit {
  groups: IGroup[] = [];
  groupForm: FormGroup;
  isGroupFormSubmit = false;
  constructor(private groupExpensesService: GroupExpensesService, private fb: FormBuilder, private spinner: NgxSpinnerService) {
    this.spinner.show()
    this.groupForm = this.fb.group({
      name: this.fb.control('', [Validators.required])
    })
  }



  ngOnInit(): void {
    this.groupExpensesService.selectDB('MyDb');
    this.getGroup()
  }

  getGroup() {
    this.spinner.show();
    this.groupExpensesService.getGroup()
      .subscribe({
        next: (val: IGroup[]) => {
          this.spinner.hide()
          this.groups = val;
          console.log(this.groups)
        },
        error: (err) => {
          this.spinner.hide()
          console.log(err);
        },
        complete: () => {
          this.spinner.hide()
        }
      })
  }

  onGroupFormSubmit() {
    this.isGroupFormSubmit = true;
    if (this.groupForm.invalid) {
      return alert('please fill form properly');
    }
    this.isGroupFormSubmit = false;
    const groupFormValue = this.groupForm.value;
    this.spinner.show();
    this.groupExpensesService.createGroups(groupFormValue.name).subscribe({
      next: (val) => {
        this.spinner.hide()
        this.getGroup()
        this.groupForm.reset();
      },
      error: (err) => {
        this.spinner.hide()
        console.log(err);
      },
      complete: () => {
        this.spinner.hide();
      }
    })

  }

  deleteGroup(groupId: number | undefined) {
    if (groupId) {
      this.spinner.show();
      this.groupExpensesService.deleteGroup(groupId).subscribe({
        next: () => {
          this.spinner.hide()
        },
        error: (error) => {
          this.spinner.hide()
          console.log(error);
        },
        complete: () => {
          this.spinner.hide();
          this.getGroup();
        }
      })
    }
  }

  deleteDatabase() {
    const choice = confirm('This will delete all your data do you want to go');
    if (choice) {
      this.groupExpensesService.deleteDatabase().subscribe(() => {
        location.reload();
      })
    }
  }


}
