import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { form, required, minLength, maxLength, pattern, FormField, FormRoot, ValidationError } from '@angular/forms/signals';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormField, MatLabel, MatError, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle } from '@angular/material/datepicker';
import { MatButton } from '@angular/material/button';
import { TranslocoDirective } from '@jsverse/transloco';
import { Customer as CustomerModel } from '../../../common/interfaces/customer';
import { Customer as CustomerService } from '../../../shared/services/customer/customer';

export interface CustomerFormDialogData {
  customer?: CustomerModel;
}

interface CustomerFormModel {
  firstName: string;
  lastName: string;
  birthDate: Date | null;
  gender: string;
  phone: string;
}

function toFormModel(customer?: CustomerModel): CustomerFormModel {
  return {
    firstName: customer?.firstName ?? '',
    lastName: customer?.lastName ?? '',
    birthDate: customer?.birthDate ? new Date(customer.birthDate) : null,
    gender: customer?.gender ?? '',
    phone: customer?.phone ?? '',
  };
}

function formatDateForApi(date: Date | null): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toCustomerPayload(value: CustomerFormModel): Omit<CustomerModel, 'id'> {
  return {
    firstName: value.firstName,
    lastName: value.lastName,
    birthDate: formatDateForApi(value.birthDate),
    gender: value.gender,
    phone: value.phone,
    paidUntil: null,
    sportNames: [],
    sports: [],
  };
}

const PHONE_PATTERN = /^[0-9+()\-\s]{7,20}$/;

@Component({
  selector: 'app-customer-form-dialog',
  imports: [
    FormField,
    FormRoot,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatFormField,
    MatLabel,
    MatError,
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
  private readonly customerService = inject(CustomerService);
  private readonly dialogRef = inject(MatDialogRef<CustomerFormDialog, CustomerModel>);

  protected readonly isEditMode = !!this.data?.customer;
  protected readonly paidUntil = this.data?.customer?.paidUntil ?? null;

  protected readonly model = signal<CustomerFormModel>(toFormModel(this.data?.customer));
  protected readonly saveError = signal(false);

  protected readonly customerForm = form(
    this.model,
    (customer) => {
      required(customer.firstName);
      minLength(customer.firstName, 2);
      maxLength(customer.firstName, 50);

      required(customer.lastName);
      minLength(customer.lastName, 2);
      maxLength(customer.lastName, 50);

      required(customer.birthDate);

      required(customer.gender);
      maxLength(customer.gender, 30);

      required(customer.phone);
      pattern(customer.phone, PHONE_PATTERN);
    },
    {
      submission: {
        action: async (field) => {
          const value = field().value();
          const payload = toCustomerPayload(value);
          const customerId = this.data?.customer?.id;

          try {
            const saved =
              customerId === undefined
                ? await firstValueFrom(this.customerService.createCustomer(payload))
                : await firstValueFrom(this.customerService.updateCustomer(customerId, payload));

            this.saveError.set(false);
            this.dialogRef.close(saved);
          } catch {
            this.saveError.set(true);
          }
          return undefined;
        },
      },
    },
  );

  protected hasError(errors: readonly ValidationError.WithFieldTree[], kind: string): boolean {
    return errors.some((e) => e.kind === kind);
  }

  protected onBirthDateChange(date: Date | null): void {
    this.model.update((m) => ({ ...m, birthDate: date }));
  }
}
