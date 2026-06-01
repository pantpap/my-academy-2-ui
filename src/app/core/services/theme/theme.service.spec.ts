import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default to light theme', () => {
    expect(service.theme()).toBe('light');
  });

  it('should toggle from light to dark', () => {
    service.toggle();
    expect(service.theme()).toBe('dark');
    expect(service.isDark()).toBe(true);
  });

  it('should toggle from dark to light', () => {
    service.set('dark');
    service.toggle();
    expect(service.theme()).toBe('light');
    expect(service.isDark()).toBe(false);
  });

  it('should set a specific theme', () => {
    service.set('dark');
    expect(service.theme()).toBe('dark');
  });

  it('should persist preference to localStorage', async () => {
    service.set('dark');
    // Allow the effect to run
    TestBed.flushEffects();
    expect(localStorage.getItem('theme-preference')).toBe('dark');
  });
});

