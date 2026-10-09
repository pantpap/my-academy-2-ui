import { ChangeDetectionStrategy, Component, inject, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
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
import { CreateOrganizationPayload } from '../../../common/interfaces/organization';

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

// Κανονικοποιημένο όνομα αθλήματος, όπως στο backend: lower(trim(name)).
function normalize(name: string): string {
  return name.trim().toLowerCase();
}

// Σελίδα προσθήκης οργανισμού από τον admin (SPEC-organizations-admin.md).
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

  protected readonly model = signal<OrganizationFormModel>({ ...EMPTY_MODEL });

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
      required(organization.password);
      minLength(organization.password, 4);
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

  protected cancel(): void {
    this.router.navigate(['/app/organizations']);
  }

  protected hasError(errors: readonly ValidationError.WithFieldTree[], kind: string): boolean {
    return errors.some((e) => e.kind === kind);
  }

  private async save(value: OrganizationFormModel): Promise<void> {
    try {
      await firstValueFrom(this.organizationsService.create(this.toCreatePayload(value)));
      this.notification.success(this.transloco.translate('organizationForm.created'));
      // Επιστροφή στο grid, που ξαναφορτώνει από τη σελίδα 1.
      this.router.navigate(['/app/organizations']);
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
}
