import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { PaymentsGrid } from './payments-grid';
import { RosterSeasonEntry, RosterSeasonMonth } from '../../../common/interfaces/payment';

const en = {
  payments: {
    athleteHeader: 'Athlete',
    summary: 'Paid',
    noSearchResults: 'No athletes match your search.',
    stateLabels: {
      paid: 'Paid',
      partial: 'Partially paid',
      unpaid: 'Due',
      unavailable: 'Not available',
    },
    unpaidSportsTooltip: 'Not paid: {{sports}}',
    cellAriaLabel: '{{name}}, {{month}} {{year}}: {{state}}',
  },
};

const SEASON_MONTHS = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6];

function blankMonth(month: number, startYear: number): RosterSeasonMonth {
  return {
    month,
    year: month >= 9 ? startYear : startYear + 1,
    status: 'unpaid',
    owedSports: [{ id: 1, name: 'Football' }],
    unpaidSports: [{ id: 1, name: 'Football' }],
    entries: [],
  };
}

function buildRoster(
  overrides: Partial<RosterSeasonEntry> = {},
  startYear = 2026,
): RosterSeasonEntry {
  return {
    athleteId: 1,
    firstName: 'Kostas',
    lastName: 'Georgiou',
    active: true,
    months: SEASON_MONTHS.map((month) => blankMonth(month, startYear)),
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

  describe('the four cell states', () => {
    function rosterWithFirstMonth(status: RosterSeasonMonth['status']): RosterSeasonEntry {
      const roster = buildRoster();
      roster.months[0] = {
        ...roster.months[0],
        status,
        unpaidSports: status === 'partial' ? [{ id: 2, name: 'Basketball' }] : [],
        entries:
          status === 'unavailable'
            ? [
                {
                  paymentId: 9,
                  amount: 40,
                  coveredMonthsCount: 1,
                  paymentDate: '2026-09-05',
                  notes: null,
                  sports: [{ id: 1, name: 'Football' }],
                },
              ]
            : [],
      };
      return roster;
    }

    it('renders "paid" as a clickable cell with a state-naming aria-label', async () => {
      await setup([rosterWithFirstMonth('paid')]);

      const cell = fixture.debugElement.query(By.css('[data-cell-state="paid"]'));
      expect(cell).toBeTruthy();
      expect(cell.nativeElement.tagName.toLowerCase()).toBe('button');
      expect(cell.nativeElement.disabled).toBe(false);
      expect(cell.attributes['aria-label']).toContain('Kostas');
      expect(cell.attributes['aria-label']).toContain('Paid');
    });

    it('renders "partial" as clickable, with the unpaid sports in the aria-label', async () => {
      await setup([rosterWithFirstMonth('partial')]);

      const cell = fixture.debugElement.query(By.css('[data-cell-state="partial"]'));
      expect(cell).toBeTruthy();
      expect(cell.nativeElement.disabled).toBe(false);
      expect(cell.attributes['aria-label']).toContain('Basketball');
    });

    it('renders "unpaid" as a clickable "due" cell', async () => {
      await setup([buildRoster()]);

      const cell = fixture.debugElement.query(By.css('[data-cell-state="unpaid"]'));
      expect(cell).toBeTruthy();
      expect(cell.nativeElement.disabled).toBe(false);
      expect(cell.attributes['aria-label']).toContain('Due');
    });

    it('renders "unavailable" with no entries as disabled and non-clickable', async () => {
      const roster = buildRoster();
      roster.months[0] = { ...roster.months[0], status: 'unavailable', owedSports: [], unpaidSports: [] };
      await setup([roster]);

      const cell = fixture.debugElement.query(By.css('[data-cell-state="unavailable"]'));
      expect(cell).toBeTruthy();
      expect(cell.nativeElement.disabled).toBe(true);
      expect(cell.attributes['aria-disabled']).toBe('true');
    });

    it('renders "unavailable" with entries as clickable', async () => {
      await setup([rosterWithFirstMonth('unavailable')]);

      const cell = fixture.debugElement.query(By.css('[data-cell-state="unavailable"]'));
      expect(cell.nativeElement.disabled).toBe(false);
    });
  });

  it('builds a tooltip listing the unpaid sports only for a partial month', async () => {
    const roster = buildRoster();
    roster.months[0] = { ...roster.months[0], status: 'partial', unpaidSports: [{ id: 2, name: 'Basketball' }] };
    await setup([roster]);

    expect(component['tooltipFor'](roster.months[0])).toBe('Basketball');
    expect(component['tooltipFor'](roster.months[1])).toBeNull(); // unpaid, no tooltip
  });

  it('reports each cell\'s own calendar year in its aria-label, across the Dec/Jan boundary', async () => {
    await setup([buildRoster()], 2026);

    const cells = fixture.debugElement.queryAll(By.css('[data-cell-state="unpaid"]'));
    expect(cells[0].attributes['aria-label']).toContain('2026');
    expect(cells[9].attributes['aria-label']).toContain('2027');
  });

  it('emits cellActivated when an unpaid cell is clicked, with the athlete and month', async () => {
    await setup([buildRoster({ athleteId: 7 })]);
    const emitted: unknown[] = [];
    component.cellActivated.subscribe((event) => emitted.push(event));

    const cell = fixture.debugElement.query(By.css('[data-cell-state="unpaid"]'));
    cell.nativeElement.click();

    expect(emitted).toEqual([
      expect.objectContaining({
        athlete: expect.objectContaining({ athleteId: 7 }),
        month: expect.objectContaining({ month: 9, year: 2026 }),
      }),
    ]);
  });

  it('does not emit cellActivated for a non-clickable unavailable cell', async () => {
    const roster = buildRoster();
    roster.months[0] = { ...roster.months[0], status: 'unavailable', owedSports: [], unpaidSports: [] };
    await setup([roster]);
    const emitted: unknown[] = [];
    component.cellActivated.subscribe((event) => emitted.push(event));

    const cell = fixture.debugElement.query(By.css('[data-cell-state="unavailable"]'));
    cell.nativeElement.click();

    expect(emitted).toEqual([]);
  });

  it('shows a paid/total summary counting only fully-paid months', async () => {
    const roster = buildRoster();
    roster.months[0] = { ...roster.months[0], status: 'paid' };
    roster.months[1] = { ...roster.months[1], status: 'paid' };
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
  });
});
