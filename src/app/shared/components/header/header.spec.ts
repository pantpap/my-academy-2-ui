import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Header } from './header';
import { ThemeService } from '../../../core/services/theme.service';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;
  let themeService: ThemeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
    }).compileComponents();

    themeService = TestBed.inject(ThemeService);
    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render a theme toggle button', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button[mat-icon-button]');
    // menu button + theme toggle button
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('should toggle theme on button click', () => {
    const initial = themeService.theme();
    const toggleBtn = fixture.nativeElement.querySelectorAll('button[mat-icon-button]')[1];
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
