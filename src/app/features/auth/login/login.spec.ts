import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';
import { Login } from './login';
import { Auth } from '../services/auth';
import { NotificationService } from '../../../core/services/notification/notification.service';

const en = {
  login: {
    title: 'Sign in',
    subtitle: 'Enter your credentials to access the system',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    emailRequired: 'Email is required',
    emailInvalid: 'Please enter a valid email address',
    passwordRequired: 'Password is required',
    hidePassword: 'Hide password',
    showPassword: 'Show password',
    submit: 'Sign in',
  },
  errors: {
    ORGANIZATION_INACTIVE: 'Your organization is inactive. Please contact the platform administrator.',
  },
};

describe('Login', () => {
  let auth: { login: ReturnType<typeof vi.fn> };
  let notification: { error: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    auth = { login: vi.fn() };
    notification = { error: vi.fn(), success: vi.fn() };
    router = { navigate: vi.fn() };
    await TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: auth },
        { provide: NotificationService, useValue: notification },
        { provide: Router, useValue: router },
      ],
      imports: [
        Login,
        TranslocoTestingModule.forRoot({
          langs: { en },
          preloadLangs: true,
          translocoConfig: {
            availableLangs: ['en', 'el'],
            defaultLang: 'en',
          },
        }),
      ],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(Login);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should have an invalid form when empty', () => {
    const fixture = TestBed.createComponent(Login);
    const component = fixture.componentInstance;
    expect(component['loginForm']().valid()).toBe(false);
  });

  it('should be invalid when email is missing', () => {
    const fixture = TestBed.createComponent(Login);
    const component = fixture.componentInstance;
    component['model'].set({ email: '', password: 'secret123' });
    expect(component['loginForm']().valid()).toBe(false);
  });

  it('should be invalid when password is missing', () => {
    const fixture = TestBed.createComponent(Login);
    const component = fixture.componentInstance;
    component['model'].set({ email: 'user@example.com', password: '' });
    expect(component['loginForm']().valid()).toBe(false);
  });

  it('should be invalid when email format is wrong', () => {
    const fixture = TestBed.createComponent(Login);
    const component = fixture.componentInstance;
    component['model'].set({ email: 'not-an-email', password: 'secret123' });
    expect(component['loginForm']().valid()).toBe(false);
  });

  it('should be valid when email and password are provided correctly', () => {
    const fixture = TestBed.createComponent(Login);
    const component = fixture.componentInstance;
    component['model'].set({ email: 'user@example.com', password: 'secret123' });
    expect(component['loginForm']().valid()).toBe(true);
  });

  it('should have email error of kind "required" when email is empty', () => {
    const fixture = TestBed.createComponent(Login);
    const component = fixture.componentInstance;
    const emailErrors = component['loginForm'].email().errors();
    expect(emailErrors.some((e) => e.kind === 'required')).toBe(true);
  });

  it('should have email error of kind "email" when email format is invalid', () => {
    const fixture = TestBed.createComponent(Login);
    const component = fixture.componentInstance;
    component['model'].set({ email: 'bad-email', password: '' });
    const emailErrors = component['loginForm'].email().errors();
    expect(emailErrors.some((e) => e.kind === 'email')).toBe(true);
  });

  it('should have password error of kind "required" when password is empty', () => {
    const fixture = TestBed.createComponent(Login);
    const component = fixture.componentInstance;
    const passwordErrors = component['loginForm'].password().errors();
    expect(passwordErrors.some((e) => e.kind === 'required')).toBe(true);
  });

  it('should toggle password visibility', () => {
    const fixture = TestBed.createComponent(Login);
    const component = fixture.componentInstance;
    expect(component['passwordVisible']()).toBe(false);
    component['togglePasswordVisibility']();
    expect(component['passwordVisible']()).toBe(true);
    component['togglePasswordVisibility']();
    expect(component['passwordVisible']()).toBe(false);
  });

  describe('sign in (SPEC-organizations-admin.md)', () => {
    const credentials = { email: 'user@example.com', password: 'secret123' };

    it('navigates into the app on success', () => {
      auth.login.mockReturnValue(of({ accessToken: 't', organization: { id: 1 } }));
      const component = TestBed.createComponent(Login).componentInstance;

      component['signIn'](credentials);

      expect(router.navigate).toHaveBeenCalledWith(['/app']);
    });

    it('shows the contact-the-administrator message for 403 ORGANIZATION_INACTIVE', () => {
      auth.login.mockReturnValue(
        throwError(
          () => new HttpErrorResponse({ status: 403, error: { message: 'ORGANIZATION_INACTIVE' } }),
        ),
      );
      const component = TestBed.createComponent(Login).componentInstance;

      component['signIn'](credentials);

      expect(notification.error).toHaveBeenCalledWith(en.errors.ORGANIZATION_INACTIVE);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('leaves wrong credentials (401) to the interceptor', () => {
      auth.login.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 401, error: { message: 'Invalid credentials' } })),
      );
      const component = TestBed.createComponent(Login).componentInstance;

      component['signIn'](credentials);

      expect(notification.error).not.toHaveBeenCalled();
    });
  });
});
