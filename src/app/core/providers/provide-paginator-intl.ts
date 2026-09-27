import { inject, Injectable, makeEnvironmentProviders } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslocoService } from '@jsverse/transloco';

interface PaginatorTranslations {
  itemsPerPage: string;
  nextPage: string;
  previousPage: string;
  firstPage: string;
  lastPage: string;
}

@Injectable()
class TranslatedPaginatorIntl extends MatPaginatorIntl {
  private readonly transloco = inject(TranslocoService);

  constructor() {
    super();
    // Εκπέμπει μόλις φορτωθεί η γλώσσα και σε κάθε αλλαγή της.
    this.transloco
      .selectTranslateObject<PaginatorTranslations>('paginator')
      .pipe(takeUntilDestroyed())
      .subscribe((labels) => {
        this.itemsPerPageLabel = labels.itemsPerPage;
        this.nextPageLabel = labels.nextPage;
        this.previousPageLabel = labels.previousPage;
        this.firstPageLabel = labels.firstPage;
        this.lastPageLabel = labels.lastPage;
        this.changes.next();
      });
  }

  // Ίδιος υπολογισμός με το default του MatPaginatorIntl, με μεταφρασμένο κείμενο.
  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return this.transloco.translate('paginator.rangeEmpty', { length });
    }
    const start = page * pageSize;
    const end = start < length ? Math.min(start + pageSize, length) : start + pageSize;
    return this.transloco.translate('paginator.range', { start: start + 1, end, length });
  };
}

export function provideTranslatedPaginatorIntl() {
  return makeEnvironmentProviders([{ provide: MatPaginatorIntl, useClass: TranslatedPaginatorIntl }]);
}
