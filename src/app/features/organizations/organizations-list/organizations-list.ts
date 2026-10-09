import { ChangeDetectionStrategy, Component, inject, input, output, ResourceRef } from '@angular/core';
import { Router } from '@angular/router';
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
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressBar } from '@angular/material/progress-bar';
import { TranslocoDirective } from '@jsverse/transloco';
import { OrganizationListItem, OrganizationsPagedResponse } from '../../../common/interfaces/organization';

@Component({
  selector: 'app-organizations-list',
  imports: [
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
    MatIcon,
    MatTooltip,
    MatPaginator,
    MatProgressBar,
    TranslocoDirective,
  ],
  templateUrl: './organizations-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationsList {
  private readonly router = inject(Router);

  readonly dataSourceResourceValue =
    input.required<ResourceRef<OrganizationsPagedResponse | undefined>>();

  readonly pageChange = output<PageEvent>();

  readonly pageSizeOptions = [10, 20, 50];

  readonly displayedColumns = ['name', 'email', 'vatNumber', 'address', 'active', 'actions'];

  onEditClick(organization: OrganizationListItem) {
    this.router.navigate(['/app/organizations', organization.id]);
  }
}
