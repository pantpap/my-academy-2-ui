import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of } from 'rxjs';
import { SubscriptionPaymentsDialog, SubscriptionPaymentsDialogData } from './subscription-payments-dialog';
import { Subscriptions } from '../../../shared/services/subscription/subscription';
import { SubscriptionPayment } from '../../../common/interfaces/subscription';

const en = {
  common: { noData: 'No data' },
  subscriptions: { paymentsTitle: 'Payments: {{name}}' },
};

// Το backend τις στέλνει ήδη με τη νεότερη πρώτη.
const payments: SubscriptionPayment[] = [
  { id: 2, paymentDate: '2026-06-01', amount: '50.00', description: null, expiresAt: '2027-05-31' },
  { id: 1, paymentDate: '2026-01-10', amount: '120.00', description: 'Yearly', expiresAt: '2027-01-09' },
];

// SPEC-organizations-admin.md, task T20.
describe('SubscriptionPaymentsDialog', () => {
  let fixture: ComponentFixture<SubscriptionPaymentsDialog>;
  let paymentsSpy: ReturnType<typeof vi.fn>;
  const data: SubscriptionPaymentsDialogData = { organizationId: 4, organizationName: 'Academy' };

  async function render(list: SubscriptionPayment[]) {
    paymentsSpy = vi.fn().mockReturnValue(of(list));
    await TestBed.configureTestingModule({
      imports: [
        SubscriptionPaymentsDialog,
        TranslocoTestingModule.forRoot({
          langs: { en },
          preloadLangs: true,
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        }),
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: Subscriptions, useValue: { payments: paymentsSpy } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SubscriptionPaymentsDialog);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const rows = () => Array.from(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row') as NodeListOf<HTMLElement>);

  it("loads the organization's payments and lists them newest first", async () => {
    await render(payments);

    expect(paymentsSpy).toHaveBeenCalledWith(4);
    expect(fixture.nativeElement.textContent).toContain('Payments: Academy');
    const cells = (r: HTMLElement) =>
      Array.from(r.querySelectorAll('td')).map((td) => td.textContent!.trim());
    expect(rows().map(cells)).toEqual([
      ['01/06/2026', '50.00', '', '31/05/2027'],
      ['10/01/2026', '120.00', 'Yearly', '09/01/2027'],
    ]);
  });

  it('has no edit or delete actions', async () => {
    await render(payments);

    expect(fixture.nativeElement.querySelectorAll('button[data-testid="edit"], button[data-testid="delete"]')).toHaveLength(0);
  });

  it('shows the no-data row without payments', async () => {
    await render([]);

    expect(fixture.nativeElement.querySelector('[data-testid="no-data"]').textContent).toContain('No data');
  });
});
