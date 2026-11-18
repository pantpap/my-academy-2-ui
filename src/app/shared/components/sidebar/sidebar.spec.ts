import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { LocalStorage } from '../../../core/services/localStorage/local-storage';
import { Auth } from '../../../features/auth/services/auth';
import { ConfirmDialog } from '../confirm-dialog/confirm-dialog';
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
    logout: 'Logout',
    logoutConfirm: {
      title: 'Logout',
      message: 'Are you sure you want to log out?',
      confirm: 'OK',
      cancel: 'Cancel',
    },
  },
};

// SPEC-organizations-admin.md, Κομμάτι 5 και Q7.
describe('Sidebar', () => {
  let auth: { logout: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    auth = { logout: vi.fn() };
    dialog = { open: vi.fn() };
  });

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
      providers: [
        provideRouter([]),
        { provide: LocalStorage, useValue: { getItem: () => organization } },
        { provide: Auth, useValue: auth },
        { provide: MatDialog, useValue: dialog },
      ],
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

  // SPEC-logout.md
  describe('user menu', () => {
    function userButton(fixture: ComponentFixture<Sidebar>): HTMLButtonElement {
      return fixture.nativeElement.querySelector('[data-testid="user-menu-trigger"]');
    }

    async function openMenu(fixture: ComponentFixture<Sidebar>): Promise<void> {
      userButton(fixture).click();
      fixture.detectChanges();
      await fixture.whenStable();
    }

    function logoutItem(): HTMLButtonElement | null {
      return document.querySelector('[data-testid="logout"]');
    }

    it('shows the user name inside the menu trigger', async () => {
      const fixture = await render({ id: 2, name: 'Academy' });

      expect(userButton(fixture).textContent).toContain('Academy');
    });

    it('opens a menu with Logout when the user row is clicked', async () => {
      const fixture = await render({ id: 2, name: 'Academy' });

      await openMenu(fixture);

      expect(logoutItem()?.textContent).toContain('Logout');
      expect(logoutItem()?.querySelector('mat-icon')?.textContent?.trim()).toBe('logout');
    });

    it('flips the arrow while the menu is open', async () => {
      const fixture = await render({ id: 2, name: 'Academy' });
      const arrow = () => fixture.nativeElement.querySelector('[data-testid="user-menu-arrow"]');
      expect(arrow().classList).not.toContain('rotate-180');

      await openMenu(fixture);

      expect(arrow().classList).toContain('rotate-180');
    });

    it('asks for confirmation with the translated texts', async () => {
      dialog.open.mockReturnValue({ afterClosed: () => of(false) });
      const fixture = await render({ id: 2, name: 'Academy' });
      await openMenu(fixture);

      logoutItem()!.click();

      expect(dialog.open).toHaveBeenCalledWith(ConfirmDialog, {
        data: {
          title: 'Logout',
          message: 'Are you sure you want to log out?',
          confirmLabel: 'OK',
          cancelLabel: 'Cancel',
        },
      });
    });

    it('logs out when confirmed', async () => {
      dialog.open.mockReturnValue({ afterClosed: () => of(true) });
      const fixture = await render({ id: 2, name: 'Academy' });
      await openMenu(fixture);

      logoutItem()!.click();

      expect(auth.logout).toHaveBeenCalledOnce();
    });

    it('does not log out when cancelled or dismissed', async () => {
      dialog.open.mockReturnValue({ afterClosed: () => of(false) });
      const fixture = await render({ id: 2, name: 'Academy' });
      await openMenu(fixture);
      logoutItem()!.click();

      dialog.open.mockReturnValue({ afterClosed: () => of(undefined) });
      await openMenu(fixture);
      logoutItem()!.click();

      expect(auth.logout).not.toHaveBeenCalled();
    });
  });
});
