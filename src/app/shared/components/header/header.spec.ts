import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { Header } from './header';
import { ThemeService } from '../../../core/services/theme.service';
import { LanguageService } from '../../../core/services/language.service';

const en = {
  header: {
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',
    switchLanguage: 'Switch language',
  },
};

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;
  let themeService: ThemeService;
  let languageService: LanguageService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Header,
        TranslocoTestingModule.forRoot({
          langs: { en },
          translocoConfig: {
            availableLangs: ['en', 'el'],
            defaultLang: 'en',
          },
        }),
      ],
    }).compileComponents();

    themeService = TestBed.inject(ThemeService);
    languageService = TestBed.inject(LanguageService);
    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a theme toggle button', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button[mat-icon-button]');
    // menu button + language button + theme toggle button
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it('should toggle theme on button click', () => {
    const initial = themeService.theme();
    const buttons = fixture.nativeElement.querySelectorAll('button[mat-icon-button]');
    const toggleBtn = buttons[buttons.length - 1]; // last button is theme toggle
    toggleBtn.click();
    expect(themeService.theme()).not.toBe(initial);
  });

  it('should show dark_mode icon in light theme', async () => {
    themeService.set('light');
    await fixture.whenStable();
    fixture.detectChanges();
    const icons = fixture.nativeElement.querySelectorAll('mat-icon');
    const themeIcon = icons[icons.length - 1];
    expect(themeIcon.textContent).toContain('dark_mode');
  });

  it('should show light_mode icon in dark theme', async () => {
    themeService.set('dark');
    await fixture.whenStable();
    fixture.detectChanges();
    const icons = fixture.nativeElement.querySelectorAll('mat-icon');
    const themeIcon = icons[icons.length - 1];
    expect(themeIcon.textContent).toContain('light_mode');
  });
});
