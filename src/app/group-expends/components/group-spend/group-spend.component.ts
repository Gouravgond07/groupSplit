import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GroupExpensesService, IExpense, IMappedExpenses, IParticipant, IParticipantExpense } from '../../services/group-expenses.service';
import { MatDialog } from '@angular/material/dialog';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { map } from 'rxjs/internal/operators/map';
import { switchMap } from 'rxjs';
import * as jspdf from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-group-spend',
  templateUrl: './group-spend.component.html',
  styleUrl: './group-spend.component.css'
})
export class GroupSpendComponent implements OnInit {
  groupId: number | undefined;
  editExpenseId: number | undefined;
  groupName: string = '';
  participants: IParticipant[] = [];
  participantForm: FormGroup;
  participantFormSubmit = false;
  expenseForm: FormGroup;
  expenseFormSubmit = false;
  mappedExpenses: IMappedExpenses[] = []
  payByArray: string[] = [];
  isActionShow = true;
  constructor(private route: ActivatedRoute, private groupExpensesService: GroupExpensesService,
    public dialog: MatDialog, private fb: FormBuilder, private spinner: NgxSpinnerService
  ) {
    this.participantForm = this.fb.group({
      name: this.fb.control('', [Validators.required])
    });
    this.expenseForm = this.fb.group(({
      name: this.fb.control('', [Validators.required]),
      amount: this.fb.control('', [Validators.required]),
      whoPaid: this.fb.control(null, [Validators.required]),
      splitOn: this.fb.group({})
    }))
  }
  ngOnInit(): void {
    this.groupExpensesService.selectDB('MyDb');
    this.route.params.subscribe(val => {
      this.groupId = +val['groupId'];
      this.groupExpensesService.getGroupById(this.groupId).subscribe({
        next: (value) => {
          this.groupName = value.name;
        },
        error(err) {

        },
      })
      this.getParticipants();
      this.getExpenses();
    })
  }

  getParticipants() {
    if (this.groupId) {
      this.spinner.show();
      this.groupExpensesService.getParticipants(this.groupId).subscribe({
        next: (value) => {
          this.participants = value;
          this.participants.forEach(x => {
            if (x.id) {
              (this.expenseForm.get('splitOn') as FormGroup).addControl(x.id.toString(), new FormControl(false))
            }
          });
        },
        error(error) {
          console.log(error);
        },
        complete: () => {
          this.spinner.hide();
        }
      })
    }
  }

  addParticipant() {
    this.participantFormSubmit = true;
    if (this.participantForm.invalid) {
      return alert('please fill form properly');;
    }
    this.participantFormSubmit = false;
    const participant = this.participantForm.value.name;
    this.spinner.show();
    if (this.groupId) {
      this.groupExpensesService.addParticipants(this.groupId, participant).subscribe({
        next: (val) => {
          this.expenseForm.get('whoPaid')?.patchValue(val.id.toString());
          this.participantForm.reset();
          this.getParticipants()
        },
        error(error) {
          console.log(error);
        },
        complete: () => {
          this.spinner.hide();
        }
      })
    }
  }


  onExpenseFormSubmit() {
    console.log(this.expenseForm.value)
    this.expenseFormSubmit = true;
    const expenseValue = this.expenseForm.value;
    const splitSelected = Object.values(expenseValue.splitOn).some(x => x === true);
    if (this.expenseForm.invalid && splitSelected) {
      return alert('please fill form properly');
    }

    if (this.editExpenseId) {
      // return this.editExpenseSubmit(this.editExpenseId, this.groupId as number, expenseValue.name, expenseValue.amount, +expenseValue.whoPaid, whoPaid?.name as string, splitOn)
      this.groupExpensesService.deleteExpense(this.editExpenseId).subscribe(() => {
        this.addExpense();
        this.editExpenseId = undefined;
      })
    } else {
      this.addExpense();
    }

  }

  addExpense() {
    const expenseValue = this.expenseForm.value;
    const splitOnIndexes = Object.keys(expenseValue.splitOn).filter(key => expenseValue.splitOn[key] === true);
    if (splitOnIndexes.length <= 0) {
      return alert('participant selection require');
    }
    const splitOnIndexesSet = new Set(splitOnIndexes)
    const splitOn = this.participants.filter(x => splitOnIndexesSet.has((x.id as Number).toString()));
    const whoPaid = this.participants.find(x => x.id == (+expenseValue.whoPaid))
    if (this.groupId && whoPaid?.name) {
      this.spinner.show();
      this.groupExpensesService.addExpenses(this.groupId, expenseValue.name, expenseValue.amount, +expenseValue.whoPaid, whoPaid.name, splitOn)
        .subscribe({
          next: () => {
            this.expenseForm.get('whoPaid')?.setValue([]);
            this.expenseForm.reset();
            this.getExpenses();
          },
          error(err) {
            console.log(err)
          },
          complete: () => {
            this.spinner.hide();
          }
        })
    }
    this.expenseForm.reset()
  }


  onCheckChange(event: any) {
    const formArray: FormArray = this.expenseForm.get('splitOn') as FormArray;

    /* Selected */
    if (event.target.checked) {
      // Add a new control in the arrayForm
      formArray.push(this.fb.control(this.participants.find(x => x.id == event.target.value)));
    }
    /* unselected */
    else {
      // find the unselected element
      let i: number = 0;

      formArray.controls.forEach((ctrl: any) => {
        if (ctrl.value == event.target.value) {
          // Remove the unselected element from the arrayForm
          formArray.removeAt(i);
          return;
        }

        i++;
      });
    }
  }

  getExpenses() {
    if (!this.groupId) {
      return;
    }
    this.spinner.show();
    this.groupExpensesService.getExpenses(this.groupId).subscribe({
      next: (value) => {
        console.log('gourav', value)
        this.mappedExpenses = value;
        this.calculateData();
      },
      error(err) {
        console.log(err)
      },
      complete: () => {
        this.spinner.hide();
      }
    })
  }



  calculateData() {
    this.payByArray = this.groupExpensesService.calculateData(this.mappedExpenses.filter(x => x.participants.length != 0), this.participants)
  }

  get amountTotal() {
    return this.mappedExpenses.reduce((a, b) => a + b.amount, 0)
  }

  selectAllParticipant(select: boolean) {
    const splitOnControl = (this.expenseForm.get('splitOn') as FormGroup);
    Object.keys(splitOnControl.value).forEach(key => {
      (splitOnControl.get(key) as FormControl).setValue(select)
    })
  }

  deleteExpense(id: number | undefined) {
    if (id) {
      this.spinner.show();
      this.groupExpensesService.deleteExpense(id).subscribe({
        next: () => {
          this.getParticipants();
          this.getExpenses();
        },
        error: (err) => {
          console.log(err);
        },
        complete: () => {
          this.spinner.hide();
        }
      })
    }
  }

  editExpense(id: number | undefined) {
    this.spinner.show();
    this.groupExpensesService.getExpensesById(id as number)
      .pipe(switchMap(x => {
        return this.groupExpensesService.getParticipantByExpenseId(id as number).pipe(map(y => {
          return { ...x, expensesParticipant: y }
        }))
      }))
      .subscribe({
        next: (value) => {
          this.spinner.hide();
          const participantIds = new Set(value.expensesParticipant.map(x => x.participantId.toString()));

          const splitOn = this.expenseForm.get('splitOn')?.value;

          Object.keys(this.expenseForm.value.splitOn).forEach(key => {
            if (participantIds.has(key)) {
              splitOn[key] = true;
            }
            splitOn[key] = false;
          });
          const data = { "name": value.description, "amount": value.amount, "whoPaid": value.whoPaid };

          this.expenseForm.patchValue(data);
          const splitOnFormGroup = this.expenseForm.get('splitOn') as FormGroup

          Object.keys(splitOnFormGroup.value).forEach(key => {
            const splitFormControl = splitOnFormGroup.get(key) as FormControl;
            if (participantIds.has(key)) {
              splitFormControl.patchValue(true);
            } else {
              splitFormControl.patchValue(false);
            }
          })
          this.editExpenseId = id;
        },
        error: (err) => {
          this.spinner.hide();
          console.log(err);
        }
      });

  }

  deleteParticipants(id: number | undefined) {
    if (id) {
      this.spinner.show();
      this.groupExpensesService.deletePartipant(id).subscribe({
        next: (value) => {
          this.getExpenses();
          this.getParticipants();
        },
        error(err) {
          console.log(err)
        },
        complete: () => {
          this.spinner.hide();

        }
      })
    }
  }


  convetToPDF() {
    this.isActionShow = false;
    setTimeout(() => {
      this.startConvert();
    }, 2000) 
   
  }


  startConvert() {
    var data: any = document.getElementById('calculateData');
    console.log(data)
    html2canvas(data).then((canvas: any) => {
      console.log(canvas);
      // Few necessary setting options
      var imgWidth = 208;
      var pageHeight = 295;
      var imgHeight = canvas.height * imgWidth / canvas.width;
      var heightLeft = imgHeight;

      const contentDataURL = canvas.toDataURL('image/png')
      let pdf = new jspdf.default('p', 'mm', 'a4'); // A4 size page of PDF
      var position = 0;
      pdf.addImage(contentDataURL, 'PNG', 0, position, imgWidth, imgHeight)
      pdf.save('new-file.pdf'); // Generated PDF
      this.isActionShow = true;
    });
  }

}
