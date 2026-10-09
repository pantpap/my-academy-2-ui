import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { By } from '@angular/platform-browser';
import { PageEvent } from '@angular/material/paginator';
import { RouterTestingHarness } from '@angular/router/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of } from 'rxjs';
import { OrganizationsContainer } from './organizations-container';
import { OrganizationsList } from '../organizations-list/organizations-list';
import { Organizations } from '../../../shared/services/organization/organization';
import { OrganizationsPagedResponse } from '../../../common/interfaces/organization';

const emptyPage: OrganizationsPagedResponse = {
  data: [],
  meta: { page: 1, take: 10, itemCount: 0, pageCount: 0, hasPreviousPage: false, hasNextPage: false },
};

describe('OrganizationsContainer', () => {
  let fixture: ComponentFixture<OrganizationsContainer>;
  let component: OrganizationsContainer;
  let list: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    list = vi.fn().mockReturnValue(of(emptyPage));
    await TestBed.configureTestingModule({
      imports: [
        OrganizationsContainer,
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        }),
      ],
      providers: [
        provideRouter([{ path: 'organizations', component: OrganizationsContainer }], withComponentInputBinding()),
        { provide: Organizations, useValue: { list } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(OrganizationsContainer);
    component = fixture.componentInstance;
    await fixture.whenStable();
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  const queryNavigation = (queryParams: Record<string, unknown>) => [
    [],
    { relativeTo: TestBed.inject(ActivatedRoute), queryParams, queryParamsHandling: 'merge', replaceUrl: true },
  ];

  it('fetches page 1 with 10 items and no name by default', () => {
    expect(list).toHaveBeenLastCalledWith(1, 10, '');
  });

  it('accepts the page sizes 10/20/50 and falls back to 10 for others', async () => {
    fixture.componentRef.setInput('take', '20');
    await fixture.whenStable();
    expect(list).toHaveBeenLastCalledWith(1, 20, '');

    fixture.componentRef.setInput('take', '25');
    await fixture.whenStable();
    expect(list).toHaveBeenLastCalledWith(1, 10, '');
  });

  it('binds page, take and name from the URL', async () => {
    list.mockClear();
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/organizations?page=2&take=50&name=acad', OrganizationsContainer);
    await harness.fixture.whenStable();

    expect(list).toHaveBeenLastCalledWith(2, 50, 'acad');
  });

  it('searches the trimmed name from page 1 when the search button is pressed', () => {
    component['searchInput'].set('  acad ');

    fixture.nativeElement.querySelector('[data-testid="search"]').click();

    expect(navigate).toHaveBeenCalledWith(...queryNavigation({ page: 1, name: 'acad' }));
  });

  it('clearing empties the field and reloads from page 1 without a name', async () => {
    fixture.componentRef.setInput('name', 'acad');
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[data-testid="clear-search"]').click();

    expect(component['searchInput']()).toBe('');
    expect(navigate).toHaveBeenCalledWith(...queryNavigation({ page: 1, name: null }));
  });

  it('navigates to the new page and size when the list pages', () => {
    const event: PageEvent = { pageIndex: 1, previousPageIndex: 0, pageSize: 20, length: 40 };

    fixture.debugElement.query(By.directive(OrganizationsList)).triggerEventHandler('pageChange', event);

    expect(navigate).toHaveBeenCalledWith(...queryNavigation({ page: 2, take: 20 }));
  });

  it('opens the new organization page from the add button', () => {
    fixture.nativeElement.querySelector('[data-testid="add"]').click();

    expect(navigate).toHaveBeenCalledWith(['/app/organizations/new']);
  });
});
