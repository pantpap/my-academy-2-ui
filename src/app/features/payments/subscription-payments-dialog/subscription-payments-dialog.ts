import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
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
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';
import { TranslocoDirective } from '@jsverse/transloco';
import { Subscriptions } from '../../../shared/services/subscription/subscription';

export interface SubscriptionPaymentsDialogData {
  organizationId: number;
  organizationName: string;
}

// Οι πληρωμές συνδρομής ενός οργανισμού, νεότερη πρώτη, όπως τις στέλνει το backend
// (SPEC-organizations-admin.md). Μόνο ανάγνωση: επεξεργασία/διαγραφή αργότερα.
@Component({
  selector: 'app-subscription-payments-dialog',
  imports: [
    DatePipe,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
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
    MatIcon,
    MatProgressBar,
    TranslocoDirective,
  ],
  templateUrl: './subscription-payments-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionPaymentsDialog {
  protected readonly data = inject<SubscriptionPaymentsDialogData>(MAT_DIALOG_DATA);
  private readonly subscriptionsService = inject(Subscriptions);

  protected readonly displayedColumns = ['paymentDate', 'amount', 'description', 'expiresAt'];

  protected readonly paymentsResource = rxResource({
    stream: () => this.subscriptionsService.payments(this.data.organizationId),
  });
}
