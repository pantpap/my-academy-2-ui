import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle } from '@angular/material/datepicker';
import { MatButton } from '@angular/material/button';
import { TranslocoDirective } from '@jsverse/transloco';
import { Customer } from '../../../common/interfaces/customer';

export interface CustomerFormDialogData {
  customer?: Customer;
}

@Component({
  selector: 'app-customer-form-dialog',
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatFormField,
    MatLabel,
    MatSuffix,
    MatInput,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatButton,
    TranslocoDirective,
  ],
  templateUrl: './customer-form-dialog.html',
  styleUrl: './customer-form-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerFormDialog {
  private readonly data = inject<CustomerFormDialogData | null>(MAT_DIALOG_DATA, {
    optional: true,
  });

  protected readonly isEditMode = !!this.data?.customer;
}
