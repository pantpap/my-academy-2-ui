import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResourceRef, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressBar } from '@angular/material/progress-bar';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { CustomerList } from './customer-list';
import { CustomersPagedResponse } from '../../../common/interfaces/customer';

function fakeResource(value: CustomersPagedResponse | undefined, loading = false) {
  return {
    value: signal(value),
    isLoading: signal(loading),
  } as unknown as ResourceRef<CustomersPagedResponse | undefined>;
}

const secondPage: CustomersPagedResponse = {
  data: [],
  meta: { page: 2, take: 25, itemCount: 42, pageCount: 2, hasPreviousPage: true, hasNextPage: false },
};

describe('CustomerList', () => {
  let component: CustomerList;
  let fixture: ComponentFixture<CustomerList>;

  async function setup(value: CustomersPagedResponse | undefined, loading = false) {
    fixture.componentRef.setInput('dataSourceResourceValue', fakeResource(value, loading));
    await fixture.whenStable();
    return fixture.debugElement.query(By.directive(MatPaginator)).componentInstance as MatPaginator;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerList, TranslocoTestingModule.forRoot({ langs: { en: {} } })],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerList);
    component = fixture.componentInstance;
  });

  it('should create', async () => {
    await setup(undefined);
    expect(component).toBeTruthy();
  });

  it('binds the paginator to the response meta', async () => {
    const paginator = await setup(secondPage);

    expect(paginator.length).toBe(42);
    expect(paginator.pageIndex).toBe(1);
    expect(paginator.pageSize).toBe(25);
    expect(paginator.pageSizeOptions).toEqual([10, 25, 50]);
  });

  it('shows an empty first page before the response arrives', async () => {
    const paginator = await setup(undefined);

    expect(paginator.length).toBe(0);
    expect(paginator.pageIndex).toBe(0);
    expect(paginator.pageSize).toBe(10);
  });

  it('emits pageChange when the paginator pages', async () => {
    const paginator = await setup(secondPage);
    const emitted: PageEvent[] = [];
    component.pageChange.subscribe((event) => emitted.push(event));

    const event: PageEvent = { pageIndex: 0, previousPageIndex: 1, pageSize: 25, length: 42 };
    paginator.page.emit(event);

    expect(emitted).toEqual([event]);
  });

  it('shows an indeterminate progress bar while loading', async () => {
    await setup(secondPage, true);

    const progressBar = fixture.debugElement.query(By.directive(MatProgressBar));
    expect(progressBar).toBeTruthy();
    expect((progressBar.componentInstance as MatProgressBar).mode).toBe('indeterminate');
  });

  it('hides the progress bar once loaded', async () => {
    await setup(secondPage, false);

    expect(fixture.debugElement.query(By.directive(MatProgressBar))).toBeNull();
  });
});
