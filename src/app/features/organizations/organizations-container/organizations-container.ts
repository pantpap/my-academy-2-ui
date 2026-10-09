import { ChangeDetectionStrategy, Component, computed, effect, inject, input, linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { TranslocoDirective } from '@jsverse/transloco';
import { OrganizationsList } from '../organizations-list/organizations-list';
import { Organizations } from '../../../shared/services/organization/organization';

// 10/20/50 από τον πίνακα αποφάσεων του spec.
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const DEFAULT_PAGE = 1;
const DEFAULT_TAKE = PAGE_SIZE_OPTIONS[0];

// Grid οργανισμών του admin (SPEC-organizations-admin.md). Ίδιο μοτίβο με το
// customer-container: σελίδα, μέγεθος και αναζήτηση ζουν στο URL.
@Component({
  selector: 'app-organizations-container',
  imports: [
    OrganizationsList,
    MatButton,
    MatIconButton,
    MatFormField,
    MatLabel,
    MatSuffix,
    MatInput,
    MatIcon,
    TranslocoDirective,
  ],
  templateUrl: './organizations-container.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationsContainer {
  private readonly organizationsService = inject(Organizations);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Query params `?page=&take=&name=` (withComponentInputBinding).
  readonly page = input<string | undefined>();
  readonly take = input<string | undefined>();
  readonly name = input<string | undefined>();

  readonly currentPage = computed(() => {
    const page = Number(this.page());
    return Number.isInteger(page) && page >= 1 ? page : DEFAULT_PAGE;
  });

  readonly currentTake = computed(() => {
    const take = Number(this.take());
    return PAGE_SIZE_OPTIONS.find((option) => option === take) ?? DEFAULT_TAKE;
  });

  readonly currentName = computed(() => this.name() ?? '');

  // Το πεδίο αναζήτησης· ψάχνει μόνο με το κουμπί.
  protected readonly searchInput = linkedSignal(() => this.currentName());

  readonly dataSourceResource = rxResource({
    params: () => ({ page: this.currentPage(), take: this.currentTake(), name: this.currentName() }),
    stream: ({ params: { page, take, name } }) => this.organizationsService.list(page, take, name),
  });

  constructor() {
    // `?page=` πέρα από την τελευταία σελίδα → τελευταία σελίδα (όπως στους πελάτες).
    effect(() => {
      if (this.dataSourceResource.isLoading()) return;

      const meta = this.dataSourceResource.value()?.meta;
      if (meta && meta.itemCount > 0 && meta.page > meta.pageCount) {
        this.updateQueryParams({ page: meta.pageCount });
      }
    });
  }

  protected onSearchInput(event: Event): void {
    this.searchInput.set((event.target as HTMLInputElement).value);
  }

  protected search(): void {
    this.updateQueryParams({ page: 1, name: this.searchInput().trim() || null });
  }

  protected clearSearch(): void {
    this.searchInput.set('');
    this.updateQueryParams({ page: 1, name: null });
  }

  protected addOrganization(): void {
    this.router.navigate(['/app/organizations/new']);
  }

  onPageChange({ pageIndex, pageSize }: PageEvent) {
    this.updateQueryParams({ page: pageIndex + 1, take: pageSize });
  }

  private updateQueryParams(queryParams: { page: number; take?: number; name?: string | null }) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
