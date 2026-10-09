import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatNoDataRow,
  MatRow,
  MatRowDef,
  MatTable,
} from '@angular/material/table';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatTooltip } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { NotificationService } from '../../../core/services/notification/notification.service';
import {
  SubscriptionPaymentFormDialog,
  SubscriptionPaymentFormDialogData,
  SubscriptionPaymentFormDialogResult,
} from '../subscription-payment-form-dialog/subscription-payment-form-dialog';
import { Subscriptions } from '../../../shared/services/subscription/subscription';
import { SubscriptionRow } from '../../../common/interfaces/subscription';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

// Grid συνδρομών του admin στη σελίδα Πληρωμές (SPEC-organizations-admin.md).
@Component({
  selector: 'app-subscriptions-grid',
  imports: [
    DatePipe,
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderCellDef,
    MatCell,
    MatCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatNoDataRow,
    MatButton,
    MatIconButton,
    MatFormField,
    MatLabel,
    MatSuffix,
    MatIcon,
    MatInput,
    MatPaginator,
    MatProgressBar,
    MatTooltip,
    TranslocoDirective,
  ],
  templateUrl: './subscriptions-grid.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionsGrid {
  private readonly subscriptionsService = inject(Subscriptions);
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);
  private readonly transloco = inject(TranslocoService);

  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  protected readonly displayedColumns = [
    'name',
    'lastPaymentDate',
    'createdAt',
    'lastAmount',
    'status',
    'actions',
  ];

  private readonly page = signal(1);
  private readonly take = signal(PAGE_SIZE_OPTIONS[0]);
  private readonly name = signal('');

  // Το πεδίο αναζήτησης· ψάχνει μόνο με το κουμπί, από τη σελίδα 1.
  protected readonly searchInput = signal('');

  protected readonly subscriptionsResource = rxResource({
    params: () => ({ page: this.page(), take: this.take(), name: this.name() }),
    stream: ({ params: { page, take, name } }) => this.subscriptionsService.list(page, take, name),
  });

  protected onSearchInput(event: Event): void {
    this.searchInput.set((event.target as HTMLInputElement).value);
  }

  protected search(): void {
    this.page.set(1);
    this.name.set(this.searchInput().trim());
  }

  protected clearSearch(): void {
    this.searchInput.set('');
    this.page.set(1);
    this.name.set('');
  }

  protected onPageChange({ pageIndex, pageSize }: PageEvent): void {
    this.page.set(pageIndex + 1);
    this.take.set(pageSize);
  }

  // Μετά την αποθήκευση: ξαναφόρτωση και μήνυμα. Η επικάλυψη επιτρέπεται, αλλά το
  // μήνυμα ενημερώνει τον admin (SPEC-organizations-admin.md).
  protected addPayment(row: SubscriptionRow): void {
    this.dialog
      .open<SubscriptionPaymentFormDialog, SubscriptionPaymentFormDialogData, SubscriptionPaymentFormDialogResult>(
        SubscriptionPaymentFormDialog,
        { width: '560px', data: { organizationId: row.organizationId, organizationName: row.name } },
      )
      .afterClosed()
      .subscribe((result) => {
        if (!result?.saved) return;
        const key = result.overlaps ? 'subscriptions.paymentSavedWithOverlap' : 'subscriptions.paymentSaved';
        this.notification.success(this.transloco.translate(key));
        this.subscriptionsResource.reload();
      });
  }

  // Dialog ιστορικού πληρωμών (T20).
  protected showPayments(_row: SubscriptionRow): void {}
}
