import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { resource } from '@angular/core';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { OrganizationsList } from './organizations-list';
import { OrganizationsPagedResponse } from '../../../common/interfaces/organization';

const en = {
  common: { noData: 'No data', edit: 'Edit' },
  table: { name: 'Name', active: 'Active' },
  organizations: { email: 'Email', vatNumber: 'VAT number', address: 'Address' },
};

const page: OrganizationsPagedResponse = {
  data: [
    { id: 4, name: 'Alpha', email: 'a@x.gr', vatNumber: '111', address: 'Street 1', isActive: true },
    { id: 5, name: 'Beta', email: 'b@x.gr', vatNumber: null, address: null, isActive: false },
  ],
  meta: { page: 1, take: 10, itemCount: 2, pageCount: 1, hasPreviousPage: false, hasNextPage: false },
};

describe('OrganizationsList', () => {
  async function render(value: OrganizationsPagedResponse): Promise<ComponentFixture<OrganizationsList>> {
    await TestBed.configureTestingModule({
      imports: [
        OrganizationsList,
        TranslocoTestingModule.forRoot({
          langs: { en },
          preloadLangs: true,
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        }),
      ],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(OrganizationsList);
    const ref = TestBed.runInInjectionContext(() => resource({ loader: async () => value }));
    fixture.componentRef.setInput('dataSourceResourceValue', ref);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  const rows = (fixture: ComponentFixture<OrganizationsList>) =>
    Array.from(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row') as NodeListOf<HTMLElement>);

  it('shows name, email, VAT number, address and an active icon per organization', async () => {
    const fixture = await render(page);

    const [alpha, beta] = rows(fixture);
    expect(alpha.textContent).toContain('Alpha');
    expect(alpha.textContent).toContain('a@x.gr');
    expect(alpha.textContent).toContain('111');
    expect(alpha.textContent).toContain('Street 1');
    expect(alpha.querySelector('[data-testid="active-icon"]')!.getAttribute('fontIcon')).toBe('check_circle');
    expect(beta.querySelector('[data-testid="active-icon"]')!.getAttribute('fontIcon')).toBe('cancel_circle');
  });

  it('shows the no-data row when there are no organizations', async () => {
    const fixture = await render({ ...page, data: [] });

    expect(fixture.nativeElement.querySelector('[data-testid="no-data"]').textContent).toContain('No data');
  });

  it('opens the organization page from the pencil', async () => {
    const fixture = await render(page);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    (rows(fixture)[1].querySelector('[data-testid="edit"]') as HTMLElement).click();

    expect(navigate).toHaveBeenCalledWith(['/app/organizations', 5]);
  });
});
