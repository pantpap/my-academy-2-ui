import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { PaymentsGrid } from './payments-grid';
import { RosterYearEntry } from '../../../common/interfaces/payment';

const en = {
  payments: {
    athleteHeader: 'Athlete',
    summary: 'Paid',
    stateLabels: {
      paid: 'Paid',
      due: 'Due',
      future: 'Not yet due',
    },
    cellAriaLabel: '{{name}}, {{month}} {{year}}: {{state}}',
  },
};

function buildRoster(overrides: Partial<RosterYearEntry> = {}): RosterYearEntry {
  return {
    athleteId: 1,
    firstName: 'Kostas',
    lastName: 'Georgiou',
    months: Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      paid: false,
      paymentId: null,
      amount: null,
      paymentDate: null,
    })),
    ...overrides,
  };
}

describe('PaymentsGrid', () => {
  let fixture: ComponentFixture<PaymentsGrid>;
  let component: PaymentsGrid;
  const today = new Date(2026, 5, 15); // June 15, 2026 — months 1-6 due, 7-12 future

  async function setup(roster: RosterYearEntry[], year = 2026) {
    await TestBed.configureTestingModule({
      imports: [
        PaymentsGrid,
        TranslocoTestingModule.forRoot({
          langs: { en },
          translocoConfig: { availableLangs: ['en', 'el'], defaultLang: 'en' },
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentsGrid);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('roster', roster);
    fixture.componentRef.setInput('year', year);
    fixture.componentRef.setInput('today', today);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('should create', async () => {
    await setup([buildRoster()]);
    expect(component).toBeTruthy();
  });

  it('renders one row per athlete with 12 month cells each', async () => {
    await setup([buildRoster({ athleteId: 1 }), buildRoster({ athleteId: 2 })]);

    const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
    expect(rows.length).toBe(2);

    const cellsInFirstRow = rows[0].queryAll(By.css('[data-cell-state]'));
    expect(cellsInFirstRow.length).toBe(12);
  });

  it('renders a paid month as a clickable cell with a state-naming aria-label', async () => {
    const roster = buildRoster();
    roster.months[0] = { month: 1, paid: true, paymentId: 55, amount: 40, paymentDate: '2026-01-05' };
    await setup([roster]);

    const paidCell = fixture.debugElement.query(By.css('[data-cell-state="paid"]'));
    expect(paidCell).toBeTruthy();
    expect(paidCell.nativeElement.tagName.toLowerCase()).toBe('button');
    expect(paidCell.attributes['aria-label']).toContain('Kostas');
    expect(paidCell.attributes['aria-label']).toContain('Paid');
  });

  it('renders an unpaid past-due month as a clickable "due" cell', async () => {
    await setup([buildRoster()]); // month 1 stays unpaid, today is June → due

    const dueCell = fixture.debugElement.query(By.css('[data-cell-state="due"]'));
    expect(dueCell).toBeTruthy();
    expect(dueCell.nativeElement.tagName.toLowerCase()).toBe('button');
    expect(dueCell.attributes['aria-label']).toContain('Due');
  });

  it('renders an unpaid future month as non-interactive', async () => {
    await setup([buildRoster()]); // month 12 (December) is after June → future

    const futureCells = fixture.debugElement.queryAll(By.css('[data-cell-state="future"]'));
    expect(futureCells.length).toBeGreaterThan(0);
    expect(futureCells[0].nativeElement.tagName.toLowerCase()).not.toBe('button');
    expect(futureCells[0].attributes['aria-label']).toContain('Not yet due');
  });

  it('emits cellActivated when a due cell is clicked, with the athlete and month', async () => {
    await setup([buildRoster({ athleteId: 7 })]);
    const emitted: unknown[] = [];
    component.cellActivated.subscribe((event) => emitted.push(event));

    const dueCell = fixture.debugElement.query(By.css('[data-cell-state="due"]'));
    dueCell.nativeElement.click();

    expect(emitted).toEqual([
      expect.objectContaining({
        athlete: expect.objectContaining({ athleteId: 7 }),
        month: expect.objectContaining({ month: 1 }),
      }),
    ]);
  });

  it('emits cellActivated when a paid cell is clicked', async () => {
    const roster = buildRoster();
    roster.months[0] = { month: 1, paid: true, paymentId: 9, amount: 40, paymentDate: '2026-01-05' };
    await setup([roster]);
    const emitted: unknown[] = [];
    component.cellActivated.subscribe((event) => emitted.push(event));

    const paidCell = fixture.debugElement.query(By.css('[data-cell-state="paid"]'));
    paidCell.nativeElement.click();

    expect(emitted.length).toBe(1);
  });

  it('shows a paid/total summary for the selected year', async () => {
    const roster = buildRoster();
    roster.months[0] = { month: 1, paid: true, paymentId: 1, amount: 40, paymentDate: '2026-01-05' };
    roster.months[1] = { month: 2, paid: true, paymentId: 2, amount: 40, paymentDate: '2026-02-05' };
    await setup([roster]);

    expect(component.paidCount()).toBe(2);
    expect(component.totalCount()).toBe(12);
    expect(fixture.nativeElement.textContent).toContain('2/12');
  });

  it('keeps the athlete column sticky for horizontal scrolling', async () => {
    await setup([buildRoster()]);

    const nameCell = fixture.debugElement.query(By.css('tbody td'));
    expect(nameCell.nativeElement.className).toContain('mat-mdc-table-sticky');
  });
});
