import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { PaymentsGrid } from './payments-grid';
import { RosterSeasonEntry } from '../../../common/interfaces/payment';

const en = {
  payments: {
    athleteHeader: 'Athlete',
    summary: 'Paid',
    noSearchResults: 'No athletes match your search.',
    stateLabels: {
      paid: 'Paid',
      due: 'Due',
    },
    cellAriaLabel: '{{name}}, {{month}} {{year}}: {{state}}',
  },
};

const SEASON_MONTHS = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6];

function buildRoster(
  overrides: Partial<RosterSeasonEntry> = {},
  startYear = 2026,
): RosterSeasonEntry {
  return {
    athleteId: 1,
    firstName: 'Kostas',
    lastName: 'Georgiou',
    months: SEASON_MONTHS.map((month) => ({
      month,
      year: month >= 9 ? startYear : startYear + 1,
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

  async function setup(roster: RosterSeasonEntry[], startYear = 2026, searchTerm = '') {
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
    fixture.componentRef.setInput('startYear', startYear);
    fixture.componentRef.setInput('searchTerm', searchTerm);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('should create', async () => {
    await setup([buildRoster()]);
    expect(component).toBeTruthy();
  });

  it('renders one row per athlete with 10 month cells each', async () => {
    await setup([buildRoster({ athleteId: 1 }), buildRoster({ athleteId: 2 })]);

    const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
    expect(rows.length).toBe(2);

    const cellsInFirstRow = rows[0].queryAll(By.css('[data-cell-state]'));
    expect(cellsInFirstRow.length).toBe(10);
  });

  it('renders the 10 columns in season order, September through June, each with its own year', async () => {
    await setup([buildRoster()], 2026);

    expect(component.monthLabels().map((label) => label.month)).toEqual(SEASON_MONTHS);
    expect(component.monthLabels().map((label) => label.year)).toEqual([
      2026, 2026, 2026, 2026, 2027, 2027, 2027, 2027, 2027, 2027,
    ]);
  });

  it('renders a paid month as a clickable cell with a state-naming aria-label', async () => {
    const roster = buildRoster();
    roster.months[0] = {
      month: 9,
      year: 2026,
      paid: true,
      paymentId: 55,
      amount: 40,
      paymentDate: '2026-09-05',
    };
    await setup([roster]);

    const paidCell = fixture.debugElement.query(By.css('[data-cell-state="paid"]'));
    expect(paidCell).toBeTruthy();
    expect(paidCell.nativeElement.tagName.toLowerCase()).toBe('button');
    expect(paidCell.attributes['aria-label']).toContain('Kostas');
    expect(paidCell.attributes['aria-label']).toContain('Paid');
  });

  it('renders every unpaid month as a clickable "due" cell', async () => {
    await setup([buildRoster()]); // every month starts unpaid

    const dueCell = fixture.debugElement.query(By.css('[data-cell-state="due"]'));
    expect(dueCell).toBeTruthy();
    expect(dueCell.nativeElement.tagName.toLowerCase()).toBe('button');
    expect(dueCell.attributes['aria-label']).toContain('Due');
  });

  it('has no non-clickable cell state — including the last month of the season', async () => {
    await setup([buildRoster()]); // June (the last column) is unpaid, same as any other month

    expect(fixture.debugElement.query(By.css('[data-cell-state="future"]'))).toBeFalsy();

    const dueCells = fixture.debugElement.queryAll(By.css('[data-cell-state="due"]'));
    expect(dueCells.length).toBe(10);
    for (const cell of dueCells) {
      expect(cell.nativeElement.tagName.toLowerCase()).toBe('button');
    }
  });

  it('reports each cell\'s own calendar year in its aria-label, across the Dec/Jan boundary', async () => {
    await setup([buildRoster()], 2026);

    // Column order is season order (September..June) — index 0 is September (year 2026),
    // index 9 is June (year 2027).
    const dueCells = fixture.debugElement.queryAll(By.css('[data-cell-state="due"]'));
    expect(dueCells[0].attributes['aria-label']).toContain('2026');
    expect(dueCells[9].attributes['aria-label']).toContain('2027');
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
        month: expect.objectContaining({ month: 9, year: 2026 }),
      }),
    ]);
  });

  it('emits cellActivated when a paid cell is clicked', async () => {
    const roster = buildRoster();
    roster.months[0] = {
      month: 9,
      year: 2026,
      paid: true,
      paymentId: 9,
      amount: 40,
      paymentDate: '2026-09-05',
    };
    await setup([roster]);
    const emitted: unknown[] = [];
    component.cellActivated.subscribe((event) => emitted.push(event));

    const paidCell = fixture.debugElement.query(By.css('[data-cell-state="paid"]'));
    paidCell.nativeElement.click();

    expect(emitted.length).toBe(1);
  });

  it('shows a paid/total summary for the selected season', async () => {
    const roster = buildRoster();
    roster.months[0] = {
      month: 9,
      year: 2026,
      paid: true,
      paymentId: 1,
      amount: 40,
      paymentDate: '2026-09-05',
    };
    roster.months[1] = {
      month: 10,
      year: 2026,
      paid: true,
      paymentId: 2,
      amount: 40,
      paymentDate: '2026-10-05',
    };
    await setup([roster]);

    expect(component.paidCount()).toBe(2);
    expect(component.totalCount()).toBe(10);
    expect(fixture.nativeElement.textContent).toContain('2/10');
  });

  it('keeps the athlete column sticky for horizontal scrolling', async () => {
    await setup([buildRoster()]);

    const nameCell = fixture.debugElement.query(By.css('tbody td'));
    expect(nameCell.nativeElement.className).toContain('mat-mdc-table-sticky');
  });

  describe('pagination', () => {
    function buildRosterOf(count: number): RosterSeasonEntry[] {
      return Array.from({ length: count }, (_, index) => buildRoster({ athleteId: index + 1 }));
    }

    it('renders only the first page (10 rows) when the roster exceeds the default page size', async () => {
      await setup(buildRosterOf(12));

      const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
      expect(rows.length).toBe(10);
    });

    it('renders the remaining rows after navigating to the next page', async () => {
      await setup(buildRosterOf(12));

      const nextButton = fixture.debugElement.query(
        By.css('.mat-mdc-paginator-navigation-next'),
      );
      nextButton.nativeElement.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
      expect(rows.length).toBe(2);
    });

    it('reports the full roster count as the paginator length', async () => {
      await setup(buildRosterOf(12));

      const paginatorLength = fixture.debugElement.query(By.css('mat-paginator'))
        .componentInstance.length;
      expect(paginatorLength).toBe(12);
    });

    it('keeps the paid/total summary based on the full roster, not just the current page', async () => {
      const roster = buildRosterOf(12);
      roster[0].months[0] = {
        month: 9,
        year: 2026,
        paid: true,
        paymentId: 1,
        amount: 40,
        paymentDate: '2026-09-05',
      };
      roster[11].months[0] = {
        month: 9,
        year: 2026,
        paid: true,
        paymentId: 2,
        amount: 40,
        paymentDate: '2026-09-05',
      };
      await setup(roster);

      expect(component.paidCount()).toBe(2);
      expect(component.totalCount()).toBe(120);
    });

    it('resets to the first page when the roster input changes', async () => {
      await setup(buildRosterOf(12));

      const nextButton = fixture.debugElement.query(
        By.css('.mat-mdc-paginator-navigation-next'),
      );
      nextButton.nativeElement.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.debugElement.queryAll(By.css('tbody tr')).length).toBe(2);

      fixture.componentRef.setInput('roster', buildRosterOf(3));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.debugElement.queryAll(By.css('tbody tr')).length).toBe(3);
    });
  });

  describe('search', () => {
    it('narrows to the athlete matching "first last" order', async () => {
      await setup(
        [buildRoster({ athleteId: 1, firstName: 'Kostas', lastName: 'Georgiou' }),
         buildRoster({ athleteId: 2, firstName: 'Maria', lastName: 'Papadaki' })],
        2026,
        'kostas geo',
      );

      const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
      expect(rows.length).toBe(1);
      expect(rows[0].nativeElement.textContent).toContain('Georgiou Kostas');
    });

    it('narrows to the athlete matching "last first" order', async () => {
      await setup(
        [buildRoster({ athleteId: 1, firstName: 'Kostas', lastName: 'Georgiou' }),
         buildRoster({ athleteId: 2, firstName: 'Maria', lastName: 'Papadaki' })],
        2026,
        'georgiou kos',
      );

      const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
      expect(rows.length).toBe(1);
      expect(rows[0].nativeElement.textContent).toContain('Georgiou Kostas');
    });

    it('is case-insensitive', async () => {
      await setup([buildRoster({ firstName: 'Kostas', lastName: 'Georgiou' })], 2026, 'KOSTAS');

      expect(fixture.debugElement.queryAll(By.css('tbody tr')).length).toBe(1);
    });

    it('shows the full roster when the search term is empty or whitespace', async () => {
      await setup(
        [buildRoster({ athleteId: 1 }), buildRoster({ athleteId: 2 })],
        2026,
        '   ',
      );

      expect(fixture.debugElement.queryAll(By.css('tbody tr')).length).toBe(2);
    });

    it('shows a no-results message and no table when nothing matches', async () => {
      await setup([buildRoster({ firstName: 'Kostas', lastName: 'Georgiou' })], 2026, 'zzz');

      expect(fixture.debugElement.query(By.css('table'))).toBeFalsy();
      expect(fixture.nativeElement.textContent).toContain('No athletes match your search.');
    });

    it('resets to the first page when the search term narrows a later page back down', async () => {
      const roster = Array.from({ length: 12 }, (_, index) =>
        buildRoster({ athleteId: index + 1, firstName: `Athlete${index + 1}` }),
      );
      await setup(roster);

      const nextButton = fixture.debugElement.query(
        By.css('.mat-mdc-paginator-navigation-next'),
      );
      nextButton.nativeElement.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.debugElement.queryAll(By.css('tbody tr')).length).toBe(2);

      fixture.componentRef.setInput('searchTerm', 'Athlete1');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      // "Athlete1", "Athlete10", "Athlete11", "Athlete12" all match — 4 rows, single page.
      const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
      expect(rows.length).toBe(4);
    });

    it('keeps the paid/total summary based on the full roster regardless of an active search term', async () => {
      const roster = [
        buildRoster({ athleteId: 1, firstName: 'Kostas', lastName: 'Georgiou' }),
        buildRoster({ athleteId: 2, firstName: 'Maria', lastName: 'Papadaki' }),
      ];
      roster[0].months[0] = {
        month: 9,
        year: 2026,
        paid: true,
        paymentId: 1,
        amount: 40,
        paymentDate: '2026-09-05',
      };
      await setup(roster, 2026, 'maria');

      expect(component.paidCount()).toBe(1);
      expect(component.totalCount()).toBe(20);
    });
  });
});
