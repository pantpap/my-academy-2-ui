import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';
import { OrganizationForm } from './organization-form';
import { Organizations } from '../../../shared/services/organization/organization';
import { Sports } from '../../../shared/services/sports/sports';
import { NotificationService } from '../../../core/services/notification/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from '../../../shared/components/confirm-dialog/confirm-dialog';

const en = {
  organizationForm: {
    sportExists: 'This sport is already in the list',
    created: 'Organization created',
    updated: 'Organization updated',
    discardTitle: 'Discard changes?',
    emailTaken: 'This email is already in use',
  },
  common: { error: 'Something went wrong' },
};

const catalog = [
  { id: 1, name: 'Judo' },
  { id: 2, name: 'Karate' },
];

const conflict = (message: string) =>
  throwError(() => new HttpErrorResponse({ status: 409, error: { message } }));

// SPEC-organizations-admin.md, task T14 (δημιουργία).
describe('OrganizationForm (create)', () => {
  let fixture: ComponentFixture<OrganizationForm>;
  let component: OrganizationForm;
  let organizations: { create: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  let sports: { catalog: ReturnType<typeof vi.fn>; addToCatalog: ReturnType<typeof vi.fn> };
  let notification: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let navigate: ReturnType<typeof vi.spyOn>;
  let dialog: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dialog = { open: vi.fn() };
    organizations = { create: vi.fn(), get: vi.fn(), update: vi.fn() };
    sports = { catalog: vi.fn().mockReturnValue(of(catalog)), addToCatalog: vi.fn() };
    notification = { success: vi.fn(), error: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [
        OrganizationForm,
        TranslocoTestingModule.forRoot({
          langs: { en },
          preloadLangs: true,
          translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
        }),
      ],
      providers: [
        provideRouter([]),
        { provide: Organizations, useValue: organizations },
        { provide: Sports, useValue: sports },
        { provide: NotificationService, useValue: notification },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(OrganizationForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  const form = () => component['organizationForm'];
  const valid = {
    name: 'Academy',
    email: 'a@x.gr',
    password: '1234',
    vatNumber: '',
    address: '',
    isActive: true,
    sportIds: [1],
  };

  async function submit() {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  describe('validation', () => {
    it('is valid with name, email, a 4+ character password and one sport', () => {
      component['model'].set(valid);
      expect(form()().valid()).toBe(true);
    });

    it.each([
      ['without a name', { name: '' }, 'name', 'required'],
      ['without an email', { email: '' }, 'email', 'required'],
      ['with an invalid email', { email: 'nope' }, 'email', 'email'],
      ['with a 3-character password', { password: '123' }, 'password', 'minLength'],
      ['without sports', { sportIds: [] }, 'sportIds', 'minLength'],
    ] as [string, Record<string, unknown>, string, string][])('is invalid %s', (_label, change, field, kind) => {
      component['model'].set({ ...valid, ...change });

      expect(form()().valid()).toBe(false);
      expect((form() as any)[field]().errors().map((e: { kind: string }) => e.kind)).toContain(kind);
    });

    it('treats VAT number and address as optional', () => {
      component['model'].set({ ...valid, vatNumber: '', address: '' });
      expect(form()().valid()).toBe(true);
    });
  });

  describe('new sport', () => {
    it('adds it to the catalog right away and selects it', async () => {
      sports.addToCatalog.mockReturnValue(of({ id: 9, name: 'Boxing' }));
      component['model'].set({ ...valid, sportIds: [1] });
      component['newSportName'].set('  Boxing ');

      component['addSport']();
      await fixture.whenStable();

      expect(sports.addToCatalog).toHaveBeenCalledWith('Boxing');
      expect(component['model']().sportIds).toEqual([1, 9]);
      expect(component['catalog']().map((s) => s.id)).toContain(9);
      expect(component['newSportName']()).toBe('');
    });

    it('does not call the backend for a name already in the catalog, ignoring case and spaces', () => {
      component['newSportName'].set('  judo ');

      component['addSport']();

      expect(sports.addToCatalog).not.toHaveBeenCalled();
      expect(component['sportError']()).toBe('This sport is already in the list');
    });

    it('shows the same message on 409 SPORT_EXISTS', async () => {
      sports.addToCatalog.mockReturnValue(conflict('SPORT_EXISTS'));
      component['newSportName'].set('Boxing');

      component['addSport']();
      await fixture.whenStable();

      expect(component['sportError']()).toBe('This sport is already in the list');
    });
  });

  describe('save', () => {
    it('creates the organization, notifies and returns to the grid on page 1', async () => {
      organizations.create.mockReturnValue(of({ id: 5 }));
      component['model'].set({ ...valid, vatNumber: '123', sportIds: [2, 1] });

      await submit();

      expect(organizations.create).toHaveBeenCalledWith({
        name: 'Academy',
        email: 'a@x.gr',
        password: '1234',
        vatNumber: '123',
        sportIds: [2, 1],
      });
      expect(notification.success).toHaveBeenCalledWith('Organization created');
      expect(navigate).toHaveBeenCalledWith(['/app/organizations']);
    });

    it('marks the email as taken on 409 and stays on the page', async () => {
      organizations.create.mockReturnValue(conflict('Organization with email "a@x.gr" already exists'));
      component['model'].set(valid);

      await submit();

      expect(form().email().errors().map((e) => e.kind)).toContain('emailTaken');
      expect(navigate).not.toHaveBeenCalled();

      component['model'].update((m) => ({ ...m, email: 'b@x.gr' }));
      expect(form().email().errors().map((e) => e.kind)).not.toContain('emailTaken');
    });

    it('shows an error notification for other failures', async () => {
      organizations.create.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      component['model'].set(valid);

      await submit();

      expect(notification.error).toHaveBeenCalledWith('Something went wrong');
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('goes straight back to the grid without changes', () => {
      fixture.nativeElement.querySelector('[data-testid="cancel"]').click();

      expect(dialog.open).not.toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith(['/app/organizations']);
    });

    it('asks for confirmation with changes, and stays when the user keeps editing', () => {
      dialog.open.mockReturnValue({ afterClosed: () => of(false) });
      component['model'].update((m) => ({ ...m, name: 'Changed' }));

      fixture.nativeElement.querySelector('[data-testid="cancel"]').click();

      expect(dialog.open).toHaveBeenCalledWith(ConfirmDialog, expect.anything());
      expect(navigate).not.toHaveBeenCalled();
    });

    it('leaves when the user confirms', () => {
      dialog.open.mockReturnValue({ afterClosed: () => of(true) });
      component['model'].update((m) => ({ ...m, name: 'Changed' }));

      fixture.nativeElement.querySelector('[data-testid="cancel"]').click();

      expect(navigate).toHaveBeenCalledWith(['/app/organizations']);
    });
  });

  // SPEC-organizations-admin.md, task T15 (επεξεργασία).
  describe('edit', () => {
    const existing = {
      id: 5,
      name: 'Academy',
      email: 'a@x.gr',
      vatNumber: '123',
      address: null,
      isActive: true,
      sports: [{ id: 2, name: 'Karate' }],
    };

    beforeEach(async () => {
      organizations.get.mockReturnValue(of(existing));
      fixture.componentRef.setInput('id', '5');
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('loads the organization into the form without a password field', () => {
      expect(organizations.get).toHaveBeenCalledWith(5);
      expect(component['model']()).toMatchObject({
        name: 'Academy',
        email: 'a@x.gr',
        vatNumber: '123',
        address: '',
        isActive: true,
        sportIds: [2],
      });
      expect(fixture.nativeElement.querySelector('[data-testid="password"]')).toBeNull();
      expect(fixture.nativeElement.querySelector('[data-testid="is-active"]')).not.toBeNull();
      expect(component['organizationForm']().valid()).toBe(true);
    });

    it('shows an enabled change-password button that does nothing yet', () => {
      const button = fixture.nativeElement.querySelector('[data-testid="change-password"]') as HTMLButtonElement;

      expect(button.disabled).toBe(false);
      button.click();
      expect(navigate).not.toHaveBeenCalled();
      expect(dialog.open).not.toHaveBeenCalled();
    });

    it('updates the organization with isActive and sportIds, then returns to the grid', async () => {
      organizations.update.mockReturnValue(of(existing));
      component['model'].update((m) => ({ ...m, isActive: false, sportIds: [2, 1] }));

      await submit();

      expect(organizations.update).toHaveBeenCalledWith(5, {
        name: 'Academy',
        email: 'a@x.gr',
        vatNumber: '123',
        address: '',
        isActive: false,
        sportIds: [2, 1],
      });
      expect(organizations.create).not.toHaveBeenCalled();
      expect(notification.success).toHaveBeenCalledWith('Organization updated');
      expect(navigate).toHaveBeenCalledWith(['/app/organizations']);
    });

    it('marks the email as taken on 409', async () => {
      organizations.update.mockReturnValue(conflict('Organization with email "a@x.gr" already exists'));

      await submit();

      expect(component['organizationForm'].email().errors().map((e) => e.kind)).toContain('emailTaken');
    });

    it('counts no change when nothing was edited, and a change after editing', () => {
      expect(component['hasChanges']()).toBe(false);

      component['model'].update((m) => ({ ...m, sportIds: [2, 1] }));

      expect(component['hasChanges']()).toBe(true);
    });
  });
});
