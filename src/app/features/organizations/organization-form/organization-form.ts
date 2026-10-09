import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { EMPTY, firstValueFrom } from 'rxjs';
import {
  applyWhen,
  email,
  form,
  FormField,
  FormRoot,
  minLength,
  required,
  validate,
  ValidationError,
} from '@angular/forms/signals';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatError, MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Organizations } from '../../../shared/services/organization/organization';
import { Sports } from '../../../shared/services/sports/sports';
import { NotificationService } from '../../../core/services/notification/notification.service';
import { Sport } from '../../../common/interfaces/sport';
import {
  CreateOrganizationPayload,
  OrganizationDetails,
  UpdateOrganizationPayload,
} from '../../../common/interfaces/organization';
import { ConfirmDialog, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';

interface OrganizationFormModel {
  name: string;
  email: string;
  password: string;
  vatNumber: string;
  address: string;
  isActive: boolean;
  sportIds: number[];
}

const EMPTY_MODEL: OrganizationFormModel = {
  name: '',
  email: '',
  password: '',
  vatNumber: '',
  address: '',
  isActive: true,
  sportIds: [],
};

function toFormModel(organization: OrganizationDetails | undefined): OrganizationFormModel {
  if (!organization) return { ...EMPTY_MODEL };
  return {
    name: organization.name,
    email: organization.email,
    password: '',
    vatNumber: organization.vatNumber ?? '',
    address: organization.address ?? '',
    isActive: organization.isActive,
    sportIds: organization.sports.map((sport) => sport.id),
  };
}

// Ίδιες τιμές, με τα αθλήματα σε οποιαδήποτε σειρά.
function sameModel(a: OrganizationFormModel, b: OrganizationFormModel): boolean {
  const sortedIds = (ids: number[]) => [...ids].sort((x, y) => x - y).join(',');
  return (
    a.name === b.name &&
    a.email === b.email &&
    a.password === b.password &&
    a.vatNumber === b.vatNumber &&
    a.address === b.address &&
    a.isActive === b.isActive &&
    sortedIds(a.sportIds) === sortedIds(b.sportIds)
  );
}

// Κανονικοποιημένο όνομα αθλήματος, όπως στο backend: lower(trim(name)).
function normalize(name: string): string {
  return name.trim().toLowerCase();
}

// Σελίδα προσθήκης και επεξεργασίας οργανισμού από τον admin (SPEC-organizations-admin.md).
@Component({
  selector: 'app-organization-form',
  imports: [
    FormField,
    FormRoot,
    MatButton,
    MatCard,
    MatCardContent,
    MatError,
    MatFormField,
    MatHint,
    MatIcon,
    MatInput,
    MatLabel,
    MatOption,
    MatSelect,
    MatSlideToggle,
    TranslocoDirective,
  ],
  templateUrl: './organization-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationForm {
  private readonly organizationsService = inject(Organizations);
  private readonly sportsService = inject(Sports);
  private readonly notification = inject(NotificationService);
  private readonly transloco = inject(TranslocoService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  // Route param `:id` (withComponentInputBinding)· χωρίς id η σελίδα είναι προσθήκη.
  readonly id = input<string>();

  protected readonly organizationId = computed(() => {
    const id = this.id();
    return id ? Number(id) : undefined;
  });
  protected readonly isEditMode = computed(() => this.organizationId() !== undefined);

  private readonly organizationResource = rxResource({
    params: () => this.organizationId(),
    stream: ({ params: id }) => (id === undefined ? EMPTY : this.organizationsService.get(id)),
  });

  // Οι αρχικές τιμές: κενές στην προσθήκη, του οργανισμού στην επεξεργασία.
  private readonly initialModel = computed(() => toFormModel(this.organizationResource.value()));

  protected readonly model = linkedSignal<OrganizationFormModel>(() => this.initialModel());

  protected readonly hasChanges = computed(() => !sameModel(this.model(), this.initialModel()));

  private readonly catalogResource = rxResource({
    stream: () => this.sportsService.catalog(),
  });

  // Ο κατάλογος, μαζί με όσα αθλήματα πρόσθεσε αυτή η φόρμα.
  protected readonly catalog = linkedSignal<Sport[]>(() => this.catalogResource.value() ?? []);

  protected readonly newSportName = signal('');
  protected readonly sportError = signal<string | null>(null);

  // Email που το backend απάντησε ότι υπάρχει ήδη (409). Το σφάλμα φεύγει μόλις αλλάξει.
  private readonly takenEmail = signal<string | null>(null);

  protected readonly organizationForm = form(
    this.model,
    (organization) => {
      required(organization.name);
      required(organization.email);
      email(organization.email);
      validate(organization.email, ({ value }) =>
        value() !== '' && value() === this.takenEmail() ? { kind: 'emailTaken' } : undefined,
      );
      // Ο κωδικός υπάρχει μόνο στην προσθήκη.
      applyWhen(organization, () => !this.isEditMode(), (newOrganization) => {
        required(newOrganization.password);
        minLength(newOrganization.password, 4);
      });
      minLength(organization.sportIds, 1);
    },
    {
      submission: {
        action: async (field) => {
          await this.save(field().value());
          return undefined;
        },
      },
    },
  );

  protected onNewSportInput(event: Event): void {
    this.newSportName.set((event.target as HTMLInputElement).value);
    this.sportError.set(null);
  }

  // Νέο άθλημα: μπαίνει στον κατάλογο αμέσως και επιλέγεται, ακόμα κι αν η φόρμα
  // ακυρωθεί μετά. Το διπλό όνομα ελέγχεται και εδώ και στο backend (409).
  protected addSport(): void {
    const name = this.newSportName().trim();
    if (!name) return;

    if (this.catalog().some((sport) => normalize(sport.name) === normalize(name))) {
      this.sportError.set(this.transloco.translate('organizationForm.sportExists'));
      return;
    }

    this.sportsService.addToCatalog(name).subscribe({
      next: (sport) => {
        this.catalog.update((sports) => [...sports, sport]);
        this.model.update((model) => ({ ...model, sportIds: [...model.sportIds, sport.id] }));
        this.newSportName.set('');
        this.sportError.set(null);
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.error?.message === 'SPORT_EXISTS') {
          this.sportError.set(this.transloco.translate('organizationForm.sportExists'));
        } else {
          this.notification.error(this.transloco.translate('common.error'));
        }
      },
    });
  }

  // Με αλλαγές ζητά επιβεβαίωση (SPEC-organizations-admin.md).
  protected cancel(): void {
    if (!this.hasChanges()) {
      this.backToGrid();
      return;
    }
    const data: ConfirmDialogData = {
      title: this.transloco.translate('organizationForm.discardTitle'),
      message: this.transloco.translate('organizationForm.discardMessage'),
      confirmLabel: this.transloco.translate('organizationForm.discardConfirm'),
      cancelLabel: this.transloco.translate('organizationForm.keepEditing'),
    };
    this.dialog
      .open(ConfirmDialog, { data })
      .afterClosed()
      .subscribe((confirmed?: boolean) => {
        if (confirmed) this.backToGrid();
      });
  }

  // Η αλλαγή κωδικού δεν έχει υλοποιηθεί ακόμα· το κουμπί μένει ενεργό χωρίς ενέργεια.
  protected changePassword(): void {}

  // Επιστροφή στο grid, που ξαναφορτώνει από τη σελίδα 1.
  private backToGrid(): void {
    this.router.navigate(['/app/organizations']);
  }

  protected hasError(errors: readonly ValidationError.WithFieldTree[], kind: string): boolean {
    return errors.some((e) => e.kind === kind);
  }

  private async save(value: OrganizationFormModel): Promise<void> {
    const id = this.organizationId();
    try {
      if (id === undefined) {
        await firstValueFrom(this.organizationsService.create(this.toCreatePayload(value)));
        this.notification.success(this.transloco.translate('organizationForm.created'));
      } else {
        await firstValueFrom(this.organizationsService.update(id, this.toUpdatePayload(value)));
        this.notification.success(this.transloco.translate('organizationForm.updated'));
      }
      this.backToGrid();
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 409) {
        this.takenEmail.set(value.email);
        this.organizationForm.email().markAsTouched();
      } else {
        this.notification.error(this.transloco.translate('common.error'));
      }
    }
  }

  // Τα προαιρετικά κενά πεδία δεν στέλνονται.
  private toCreatePayload(value: OrganizationFormModel): CreateOrganizationPayload {
    return {
      name: value.name.trim(),
      email: value.email.trim(),
      password: value.password,
      ...(value.vatNumber.trim() ? { vatNumber: value.vatNumber.trim() } : {}),
      ...(value.address.trim() ? { address: value.address.trim() } : {}),
      sportIds: value.sportIds,
    };
  }

  // Στην επεξεργασία ΑΦΜ και διεύθυνση στέλνονται πάντα, ώστε να μπορούν να αδειάσουν.
  private toUpdatePayload(value: OrganizationFormModel): UpdateOrganizationPayload {
    return {
      name: value.name.trim(),
      email: value.email.trim(),
      vatNumber: value.vatNumber.trim(),
      address: value.address.trim(),
      isActive: value.isActive,
      sportIds: value.sportIds,
    };
  }
}
