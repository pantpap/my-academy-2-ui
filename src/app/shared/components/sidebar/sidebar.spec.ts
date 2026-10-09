import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { LocalStorage } from '../../../core/services/localStorage/local-storage';
import { Sidebar } from './sidebar';

const en = {
  sidebar: {
    sections: { main: 'Main', system: 'System' },
    dashboard: 'Dashboard',
    customers: 'Customers',
    payments: 'Payments',
    events: 'Events',
    organizations: 'Organizations',
    settings: 'Settings',
  },
};

// SPEC-organizations-admin.md, Κομμάτι 5 και Q7.
describe('Sidebar', () => {
  async function render(organization: unknown): Promise<ComponentFixture<Sidebar>> {
    await TestBed.configureTestingModule({
      imports: [
        Sidebar,
        TranslocoTestingModule.forRoot({
          langs: { en },
          preloadLangs: true,
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        }),
      ],
      providers: [provideRouter([]), { provide: LocalStorage, useValue: { getItem: () => organization } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(Sidebar);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  function linkLabels(fixture: ComponentFixture<Sidebar>): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll('nav a span') as NodeListOf<HTMLElement>).map(
      (el) => el.textContent!.trim(),
    );
  }

  it('shows the admin Dashboard, Organizations, Payments and Settings', async () => {
    const fixture = await render({ id: 1, name: 'Admin', role: 'admin' });

    expect(linkLabels(fixture)).toEqual(['Dashboard', 'Organizations', 'Payments', 'Settings']);
  });

  it('shows an organization the same pages as before, translated', async () => {
    const fixture = await render({ id: 2, name: 'Academy', role: 'organization' });

    expect(linkLabels(fixture)).toEqual(['Dashboard', 'Customers', 'Payments', 'Events', 'Settings']);
    const sections = Array.from(fixture.nativeElement.querySelectorAll('nav p') as NodeListOf<HTMLElement>).map(
      (el) => el.textContent!.trim(),
    );
    expect(sections).toEqual(['Main', 'System']);
  });

  it('treats a stored organization without role as an organization', async () => {
    const fixture = await render({ id: 2, name: 'Academy' });

    expect(linkLabels(fixture)).toContain('Customers');
  });
});
