import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
} from '@angular/material/table';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { RosterSeasonEntry, RosterSeasonMonth } from '../../../common/interfaces/payment';
import { LanguageService } from '../../../core/services/language/language.service';
import { CellState, cellState, isClickable } from './cell-state';

export interface PaymentsGridCellActivated {
  athlete: RosterSeasonEntry;
  month: RosterSeasonMonth;
}

interface MonthLabel {
  month: number;
  year: number;
  label: string;
}

// Fixed season order: September(startYear) -> June(startYear + 1).
const SEASON_MONTHS = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6];

const CELL_ICONS: Record<CellState, string> = {
  paid: 'check_circle',
  partial: 'close',
  unpaid: 'schedule',
  unavailable: 'schedule',
};

@Component({
  selector: 'app-payments-grid',
  imports: [
    MatIcon,
    MatTooltip,
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderCellDef,
    MatCell,
    MatCellDef,
    MatHeaderRow,
    MatRow,
    MatHeaderRowDef,
    MatRowDef,
    MatPaginator,
    TranslocoDirective,
  ],
  templateUrl: './payments-grid.html',
  styleUrl: './payments-grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsGrid {
  private readonly translocoService = inject(TranslocoService);
  private readonly languageService = inject(LanguageService);

  readonly roster = input.required<RosterSeasonEntry[]>();
  readonly startYear = input.required<number>();
  readonly searchTerm = input<string>('');

  readonly cellActivated = output<PaymentsGridCellActivated>();

  readonly pageSizeOptions = [10, 25, 50] as const;
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal<number>(this.pageSizeOptions[0]);

  private readonly resetPageOnRosterOrSearchChange = effect(() => {
    this.roster();
    this.searchTerm();
    untracked(() => this.pageIndex.set(0));
  });

  readonly filteredRoster = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.roster();
    return this.roster().filter((entry) => this.matchesSearch(entry, term));
  });

  readonly pagedRoster = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredRoster().slice(start, start + this.pageSize());
  });

  readonly monthLabels = computed<MonthLabel[]>(() => {
    const locale = this.languageService.language() === 'el' ? 'el-GR' : 'en-US';
    const formatter = new Intl.DateTimeFormat(locale, { month: 'short' });
    const startYear = this.startYear();
    return SEASON_MONTHS.map((month) => ({
      month,
      year: month >= 9 ? startYear : startYear + 1,
      label: formatter.format(new Date(2020, month - 1, 1)),
    }));
  });

  readonly displayedColumns = computed(() => [
    'name',
    ...this.monthLabels().map((label) => `m${label.month}`),
  ]);

  // Εκτός scope (SPEC-payments-sports-grid.md): μόνο ώστε το summary να κάνει
  // compile με το νέο μοντέλο status. "Πλήρως πληρωμένα" μόνο.
  readonly totalCount = computed(() => this.roster().length * this.monthLabels().length);
  readonly paidCount = computed(() =>
    this.roster().reduce(
      (sum, entry) => sum + entry.months.filter((month) => month.status === 'paid').length,
      0,
    ),
  );

  protected readonly cellIcons = CELL_ICONS;

  protected stateFor(month: RosterSeasonMonth): CellState {
    return cellState(month);
  }

  protected isClickable(month: RosterSeasonMonth): boolean {
    return isClickable(month);
  }

  protected monthFor(entry: RosterSeasonEntry, monthNumber: number): RosterSeasonMonth {
    return entry.months.find((month) => month.month === monthNumber)!;
  }

  protected tooltipFor(month: RosterSeasonMonth): string | null {
    if (month.status !== 'partial' || month.unpaidSports.length === 0) return null;
    return month.unpaidSports.map((sport) => sport.name).join(', ');
  }

  private matchesSearch(entry: RosterSeasonEntry, term: string): boolean {
    const firstLast = `${entry.firstName} ${entry.lastName}`.toLowerCase();
    const lastFirst = `${entry.lastName} ${entry.firstName}`.toLowerCase();
    return firstLast.includes(term) || lastFirst.includes(term);
  }

  protected cellAriaLabel(entry: RosterSeasonEntry, month: RosterSeasonMonth): string {
    const state = this.stateFor(month);
    let stateLabel = this.translocoService.translate(`payments.stateLabels.${state}`);
    if (state === 'partial' && month.unpaidSports.length > 0) {
      stateLabel = this.translocoService.translate('payments.unpaidSportsTooltip', {
        sports: month.unpaidSports.map((sport) => sport.name).join(', '),
      });
    }
    const monthLabel = this.monthLabels().find((label) => label.month === month.month)?.label ?? '';

    return this.translocoService.translate('payments.cellAriaLabel', {
      name: `${entry.firstName} ${entry.lastName}`,
      month: monthLabel,
      year: month.year,
      state: stateLabel,
    });
  }

  protected onCellActivate(entry: RosterSeasonEntry, month: RosterSeasonMonth): void {
    if (!this.isClickable(month)) return;
    this.cellActivated.emit({ athlete: entry, month });
  }

  protected onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }
}
