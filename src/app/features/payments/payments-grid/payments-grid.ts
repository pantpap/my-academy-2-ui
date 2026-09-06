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
import { RosterYearEntry, RosterYearMonth } from '../../../common/interfaces/payment';
import { LanguageService } from '../../../core/services/language/language.service';
import { CellState, cellState } from './cell-state';

export interface PaymentsGridCellActivated {
  athlete: RosterYearEntry;
  month: RosterYearMonth;
}

interface MonthLabel {
  number: number;
  label: string;
}

@Component({
  selector: 'app-payments-grid',
  imports: [
    MatIcon,
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

  readonly roster = input.required<RosterYearEntry[]>();
  readonly year = input.required<number>();
  readonly today = input<Date>(new Date());

  readonly cellActivated = output<PaymentsGridCellActivated>();

  readonly pageSizeOptions = [10, 25, 50] as const;
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal<number>(this.pageSizeOptions[0]);

  private readonly resetPageOnRosterChange = effect(() => {
    this.roster();
    untracked(() => this.pageIndex.set(0));
  });

  readonly pagedRoster = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.roster().slice(start, start + this.pageSize());
  });

  readonly monthLabels = computed<MonthLabel[]>(() => {
    const locale = this.languageService.language() === 'el' ? 'el-GR' : 'en-US';
    const formatter = new Intl.DateTimeFormat(locale, { month: 'short' });
    return Array.from({ length: 12 }, (_, index) => ({
      number: index + 1,
      label: formatter.format(new Date(2020, index, 1)),
    }));
  });

  readonly displayedColumns = computed(() => [
    'name',
    ...this.monthLabels().map((label) => `m${label.number}`),
  ]);

  readonly totalCount = computed(() => this.roster().length * 12);
  readonly paidCount = computed(() =>
    this.roster().reduce(
      (sum, entry) => sum + entry.months.filter((month) => month.paid).length,
      0,
    ),
  );

  protected stateFor(month: RosterYearMonth): CellState {
    return cellState(month.month, month.paid, this.year(), this.today());
  }

  protected monthFor(entry: RosterYearEntry, monthNumber: number): RosterYearMonth {
    return entry.months.find((month) => month.month === monthNumber)!;
  }

  protected cellAriaLabel(entry: RosterYearEntry, month: RosterYearMonth): string {
    const state = this.stateFor(month);
    const stateLabel = this.translocoService.translate(`payments.stateLabels.${state}`);
    const monthLabel = this.monthLabels()[month.month - 1].label;

    return this.translocoService.translate('payments.cellAriaLabel', {
      name: `${entry.firstName} ${entry.lastName}`,
      month: monthLabel,
      year: this.year(),
      state: stateLabel,
    });
  }

  protected onCellActivate(entry: RosterYearEntry, month: RosterYearMonth): void {
    this.cellActivated.emit({ athlete: entry, month });
  }

  protected onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }
}
