import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { EMPTY, firstValueFrom } from 'rxjs';
import { form, required, minLength, maxLength, pattern, FormField, FormRoot, ValidationError } from '@angular/forms/signals';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatFormField, MatLabel, MatError, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle } from '@angular/material/datepicker';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { TranslocoDirective } from '@jsverse/transloco';
import { Customer as CustomerService } from '../../../shared/services/customer/customer';
import { Customer as CustomerModel } from '../../../common/interfaces/customer';
import { CustomerFormDialog } from '../customer-form-dialog/customer-form-dialog';

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
  selector: 'app-customer-details',
  imports: [
    FormField,
    FormRoot,
    MatCard,
    MatCardContent,
    MatFormField,
    MatLabel,
    MatError,
    MatSuffix,
    MatInput,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatButton,
    MatIcon,
    TranslocoDirective,
  ],
  templateUrl: './customer-details.html',
  styleUrl: './customer-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerDetails {
  private readonly customerService = inject(CustomerService);
  private readonly dialog = inject(MatDialog);

  readonly id = input<string>();

  private readonly routeId = computed(() => {
    const id = this.id();
    return id ? Number(id) : undefined;
  });


  // Decoupled from routeId so a successful create flips into edit mode without
  // re-triggering a GET (avoids a loading flicker right after saving).
  protected readonly activeId = linkedSignal<number | undefined>(() => this.routeId());
  protected readonly isEditMode = computed(() => this.activeId() !== undefined);

  protected readonly customerDetailsResource = rxResource({
    params: () => this.routeId(),
    stream: ({ params: customerId }) =>
      customerId === undefined ? EMPTY : this.customerService.getCustomer(customerId),
  });

  protected readonly model = linkedSignal<CustomerModel | undefined, CustomerFormModel>({
    source: () => this.customerDetailsResource.value(),
    computation: (customer) => toFormModel(customer),
  });

  protected readonly saveSuccess = signal<'created' | 'updated' | null>(null);
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
          const currentId = this.activeId();

          try {
            const saved = currentId === undefined
              ? await firstValueFrom(this.customerService.createCustomer(payload))
              : await firstValueFrom(this.customerService.updateCustomer(currentId, payload));

            this.activeId.set(saved.id);
            this.model.set(toFormModel(saved));
            this.saveError.set(false);
            this.saveSuccess.set(currentId === undefined ? 'created' : 'updated');
          } catch {
            this.saveSuccess.set(null);
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

  protected openEditDialog() {
    this.dialog.open(CustomerFormDialog, {
      data: { customer: this.customerDetailsResource.value() },
    });
  }
}
