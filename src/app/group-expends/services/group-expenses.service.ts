import { Injectable } from '@angular/core';
import { NgxIndexedDBService } from 'ngx-indexed-db';
import { Observable } from 'rxjs';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { of } from 'rxjs/internal/observable/of';
import { delay, map, mergeMap } from 'rxjs/operators';


export interface IGroup {
  id?: number;
  name: string;
}

export interface IParticipant {
  id?: number,
  name: string,
  groupId: number,

}

export interface IExpense {
  id?: number,
  groupId: number, description: string, amount: number, whoPaid: number, whoPaidName: string
}

export interface IParticipantExpense {
  id?: number,
  groupId: number, expenseId: number, participantId: number, participantName: string
}

export interface IMappedExpenses {
  participants: string[];
  participantsId: number[];
  id?: number | undefined;
  groupId: number;
  description: string;
  amount: number;
  whoPaid: number;
  whoPaidName: string;
  participantExpenseIds: number[]
}

export interface ICalculateData {
  description: string;
  amount: number;
  whoPaid: string;
  participants: string[];
}[]
@Injectable({
  providedIn: 'root'
})
export class GroupExpensesService {
  private GROUP_STORE = 'groupTable';
  private PARTICIPANT_STORE = 'ParticipantsTable';
  private EXPENSE_STORE = 'ExpensesTable'
  private PARTICIPANT_EXPENSE_STORE = 'ParticipantExpenseTable'
  constructor(private dbService: NgxIndexedDBService) {
    this.selectDB('MyDb')
  }

  selectDB(dbName: string) {
    this.dbService.selectDb(dbName);
  }

  createGroups(groupName: string) {
    return this.dbService.add<IGroup>(this.GROUP_STORE, {
      name: groupName
    })
  }

  getGroup() {
    return this.dbService.getAll<IGroup>(this.GROUP_STORE);
  }

  getGroupById(id: number) {
    return this.dbService.getByID<IGroup>(this.GROUP_STORE, id);
  }

  deleteGroup(id: number) {
    const participantObs = this.getParticipants(id);
    const expenseObs = this.getExpenses(id);
    return forkJoin([
      this.dbService.delete(this.GROUP_STORE, id),
      participantObs.pipe(map(x => {
        const participantIds: number[] = x.map(y => y.id as number);
        return this.dbService.bulkDelete(this.PARTICIPANT_STORE, participantIds)
      })),
      expenseObs.pipe(map(x => {
        const expenseIds: number[] = x.map(y => y.id as number);
        return this.dbService.bulkDelete(this.EXPENSE_STORE, expenseIds);
      })),
      expenseObs.pipe(map(x => {
        // const expenseIds: number[] = x.map(y => y.id as number);
        const participantExpenseIds = x.map(y => y.participantExpenseIds).flat(1)
        return this.dbService.bulkDelete(this.PARTICIPANT_EXPENSE_STORE, participantExpenseIds);
      }))
    ]).pipe(delay(2000))
  }


  getParticipants(groupId: number) {
    return this.dbService.getAll<IParticipant>(this.PARTICIPANT_STORE).pipe(map(participants => participants.filter(x => x.groupId == groupId)))
  }

  addParticipants(groupId: number, participantname: string) {
    return this.dbService.add<IParticipant>(this.PARTICIPANT_STORE, {
      name: participantname,
      groupId: groupId
    })
  }

  deleteParticipant(id: number) {
    return this.dbService.delete(this.PARTICIPANT_STORE, id);
  }

  addExpenses(groupId: number, description: string, amount: number, whoPaid: number, whoPaidName: string, splitOn: IParticipant[]) {
    return this.dbService.add<IExpense>(this.EXPENSE_STORE, {
      groupId, description, amount, whoPaidName, whoPaid
    }).pipe(map(x => {
      const data = splitOn.map(participant => ({ groupId, expenseId: x.id, participantId: participant.id, participantName: participant.name }));
      return this.dbService.bulkAdd(this.PARTICIPANT_EXPENSE_STORE, data)
    }));
  }

  deleteExpenses(expenseId: number) {
    this.dbService.delete<IExpense>(this.EXPENSE_STORE, expenseId);
    this.getParticipantByExpenseId(expenseId).pipe(map(x => x.map(x => x.id)), map(ids => this.dbService.bulkDelete(this.PARTICIPANT_EXPENSE_STORE, ids as number[])))
  }

  getExpenses(groupId: number): Observable<IMappedExpenses[]> {
    return this.dbService.getAll<IExpense>(this.EXPENSE_STORE)
      .pipe(map(x => x.filter(y => y.groupId === groupId)), mergeMap(expenses => {
        const obsArray = expenses.map(expense => this.dbService.getAll<IParticipantExpense>(this.PARTICIPANT_EXPENSE_STORE).pipe(
          map(x => x.filter(y => y.expenseId == expense.id))
        ))
        return forkJoin([of(expenses), obsArray.length === 0 ? of([]) : forkJoin(obsArray)])
      })).pipe(map(([expenses, participant]) => {
        return expenses.map((x, i) => ({
          ...x,
          participants: participant[i].map(y => y.participantName),
          participantsId: participant[i].map(y => y.participantId),
          participantExpenseIds: participant[i].map(y => (y.id as number))
        }));
      }

      ))
  }

  calculateSettlements(expenses: ICalculateData[], participants: IParticipant[]) {
    const participantBalances: any = {};
    participants.forEach(x => {
      participantBalances[x.name] = 0;
    })

    // Calculate total expenses and individual contributions
    expenses.forEach(expense => {
      const contribution = expense.amount / expense.participants.length;
      participantBalances[expense.whoPaid] -= expense.amount; // Deduct the expense from the payer's 
      expense.participants.forEach(participant => {
        participantBalances[participant] += contribution; // Add the contribution to each participant's balance
      });
    });

    return participantBalances;
  }


  generateSettlementInstructions(settlements: any) {
    const instructions = [];
    for (const payer in settlements) {
      for (const receiver in settlements) {
        if (payer !== receiver) {
          const amount = Math.min(-settlements[payer], settlements[receiver]);
          if (amount > 0) {
            instructions.push(`${receiver} pays ${payer} ${amount}`);
          }
        }
      }
    }
    return instructions;
  }


  calculateData(data: IMappedExpenses[], participants: IParticipant[]): string[] {
    const temp: ICalculateData[] = data.map(x => {
      return {
        amount: x.amount,
        description: x.description,
        participants: x.participants,
        whoPaid: x.whoPaidName
      }
    });
    
    const t = this.calculateSettlements(temp, participants);
    console.log('t', t)
    const p = this.generateSettlementInstructions(t);
    console.log('p', p)
    return p;
  }

  deleteExpense(expenseId: number) {
    return this.dbService.delete<IExpense>(this.EXPENSE_STORE, expenseId);
  }

  deletePartipant(participantId: number) {
    return forkJoin(
      [
        this.dbService.delete<IParticipant>(this.PARTICIPANT_STORE, participantId),
        this.dbService.getAll<IParticipantExpense>(this.PARTICIPANT_EXPENSE_STORE).pipe(
          map(expenses => expenses.filter(x => x.participantId).map(x => x.id as number)),
          map(participantIds => this.dbService.bulkDelete(this.PARTICIPANT_EXPENSE_STORE, participantIds))
        ),
        this.dbService.getAll<IExpense>(this.EXPENSE_STORE).pipe(
          map(expense => expense.filter(x => x.whoPaid == participantId)),
          map(x => x.map(x => x.id as number)),
          map(expenseids => this.dbService.bulkDelete(this.EXPENSE_STORE, expenseids))
        )
      ]
    )

  }

  getExpensesById(expenseId: number) {
    return this.dbService.getByID<IExpense>(this.EXPENSE_STORE, expenseId);
  }


  getParticipantByExpenseId(expenseId: number): Observable<IParticipantExpense[]> {
    return this.dbService.getAll<IParticipantExpense>(this.PARTICIPANT_EXPENSE_STORE).pipe(
      map(x => x.filter(y => y.expenseId === expenseId)
    )
    )
  }


  deleteDatabase() {
    return this.dbService.deleteDatabase();
  }


}
