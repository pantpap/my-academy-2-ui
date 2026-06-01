import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { Login } from './login';

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
};

describe('Login', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Login,
        TranslocoTestingModule.forRoot({
          langs: { en },
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
});

