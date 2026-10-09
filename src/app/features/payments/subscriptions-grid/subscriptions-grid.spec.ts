import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PageEvent, MatPaginator } from '@angular/material/paginator';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of } from 'rxjs';
import { SubscriptionsGrid } from './subscriptions-grid';
import { Subscriptions } from '../../../shared/services/subscription/subscription';
import { SubscriptionRow, SubscriptionsPagedResponse } from '../../../common/interfaces/subscription';

const en = {
  common: { noData: 'No data' },
  table: { paid: 'Paid', unpaid: 'Unpaid' },
  subscriptions: { expiring: 'Expiring soon' },
};

function row(organizationId: number, status: SubscriptionRow['status']): SubscriptionRow {
  return {
    organizationId,
    name: `Org ${organizationId}`,
    createdAt: '2026-02-03',
    lastPaymentDate: status === 'unpaid' ? null : '2026-01-10',
    lastAmount: status === 'unpaid' ? null : '120.00',
    expiresAt: status === 'unpaid' ? null : '2027-01-09',
    status,
  };
}

const page = (data: SubscriptionRow[]): SubscriptionsPagedResponse => ({
  data,
  meta: { page: 1, take: 10, itemCount: data.length, pageCount: 1, hasPreviousPage: false, hasNextPage: false },
});

// SPEC-organizations-admin.md, task T18.
describe('SubscriptionsGrid', () => {
  let fixture: ComponentFixture<SubscriptionsGrid>;
  let list: ReturnType<typeof vi.fn>;

  async function render(data: SubscriptionRow[]) {
    list = vi.fn().mockReturnValue(of(page(data)));
    await TestBed.configureTestingModule({
      imports: [
        SubscriptionsGrid,
        TranslocoTestingModule.forRoot({
          langs: { en },
          preloadLangs: true,
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        }),
      ],
      providers: [{ provide: Subscriptions, useValue: { list } }],
    }).compileComponents();
    fixture = TestBed.createComponent(SubscriptionsGrid);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const rows = () => Array.from(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row') as NodeListOf<HTMLElement>);

  it('loads page 1 with 10 rows and no name', async () => {
    await render([]);
    expect(list).toHaveBeenLastCalledWith(1, 10, '');
  });

  it('shows name, last payment, registration date, amount and two actions per row', async () => {
    await render([row(1, 'paid')]);

    const [first] = rows();
    expect(first.textContent).toContain('Org 1');
    expect(first.textContent).toContain('10/01/2026');
    expect(first.textContent).toContain('03/02/2026');
    expect(first.textContent).toContain('120.00');
    expect(first.querySelector('[data-testid="add-payment"]')).not.toBeNull();
    expect(first.querySelector('[data-testid="show-payments"]')).not.toBeNull();
  });

  it.each([
    ['paid', 'Paid', 'bg-green-100'],
    ['unpaid', 'Unpaid', 'bg-red-100'],
    ['expiring', 'Expiring soon', 'bg-orange-100'],
  ] as const)('shows the %s badge', async (status, text, color) => {
    await render([row(1, status)]);

    const badge = rows()[0].querySelector('[data-testid="status"]') as HTMLElement;
    expect(badge.textContent!.trim()).toBe(text);
    expect(badge.classList).toContain(color);
  });

  it('shows the no-data row when there are no organizations', async () => {
    await render([]);
    expect(fixture.nativeElement.querySelector('[data-testid="no-data"]').textContent).toContain('No data');
  });

  it('searches the trimmed name from page 1 with the button, and clears back', async () => {
    await render([row(1, 'paid')]);
    fixture.debugElement
      .query(By.directive(MatPaginator))
      .triggerEventHandler('page', { pageIndex: 2, pageSize: 20 } as PageEvent);
    await fixture.whenStable();
    expect(list).toHaveBeenLastCalledWith(3, 20, '');

    const input = fixture.nativeElement.querySelector('[data-testid="search-input"]') as HTMLInputElement;
    input.value = '  acad ';
    input.dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('[data-testid="search"]').click();
    await fixture.whenStable();
    expect(list).toHaveBeenLastCalledWith(1, 20, 'acad');

    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-testid="clear-search"]').click();
    await fixture.whenStable();
    expect(list).toHaveBeenLastCalledWith(1, 20, '');
    expect(input.value).toBe('');
  });

  it('offers 10/20/50 rows per page', async () => {
    await render([]);
    expect(fixture.debugElement.query(By.directive(MatPaginator)).componentInstance.pageSizeOptions).toEqual([
      10, 20, 50,
    ]);
  });
});
