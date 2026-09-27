import { TestBed } from '@angular/core/testing';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslocoService, TranslocoTestingModule } from '@jsverse/transloco';

import { provideTranslatedPaginatorIntl } from './provide-paginator-intl';

// Οι τιμές διαφέρουν σκόπιμα από τα defaults του MatPaginatorIntl, ώστε τα tests να
// αποτυγχάνουν αν ο provider δεν εφαρμοστεί.
const en = {
  paginator: {
    itemsPerPage: 'Rows per page:',
    nextPage: 'Go to next page',
    previousPage: 'Go to previous page',
    firstPage: 'Go to first page',
    lastPage: 'Go to last page',
    range: '{{start}}-{{end}} / {{length}}',
    rangeEmpty: 'none / {{length}}',
  },
};

const el = {
  paginator: {
    itemsPerPage: 'Εγγραφές ανά σελίδα:',
    nextPage: 'Επόμενη σελίδα',
    previousPage: 'Προηγούμενη σελίδα',
    firstPage: 'Πρώτη σελίδα',
    lastPage: 'Τελευταία σελίδα',
    range: '{{start}} – {{end}} από {{length}}',
    rangeEmpty: '0 από {{length}}',
  },
};

describe('provideTranslatedPaginatorIntl', () => {
  let intl: MatPaginatorIntl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en, el },
          translocoConfig: { availableLangs: ['en', 'el'], defaultLang: 'en' },
          preloadLangs: true,
        }),
      ],
      providers: [provideTranslatedPaginatorIntl()],
    });

    intl = TestBed.inject(MatPaginatorIntl);
  });

  it('uses the translated labels', () => {
    expect(intl.itemsPerPageLabel).toBe('Rows per page:');
    expect(intl.nextPageLabel).toBe('Go to next page');
    expect(intl.previousPageLabel).toBe('Go to previous page');
    expect(intl.firstPageLabel).toBe('Go to first page');
    expect(intl.lastPageLabel).toBe('Go to last page');
  });

  it('builds the range label from the translation', () => {
    expect(intl.getRangeLabel(0, 10, 0)).toBe('none / 0');
    expect(intl.getRangeLabel(0, 10, 42)).toBe('1-10 / 42');
    expect(intl.getRangeLabel(4, 10, 42)).toBe('41-42 / 42');
  });

  it('updates the labels and notifies the paginator when the language changes', () => {
    const changes = vi.fn();
    intl.changes.subscribe(changes);

    TestBed.inject(TranslocoService).setActiveLang('el');

    expect(intl.itemsPerPageLabel).toBe('Εγγραφές ανά σελίδα:');
    expect(intl.lastPageLabel).toBe('Τελευταία σελίδα');
    expect(intl.getRangeLabel(0, 10, 42)).toBe('1 – 10 από 42');
    expect(intl.getRangeLabel(0, 10, 0)).toBe('0 από 0');
    expect(changes).toHaveBeenCalled();
  });
});
