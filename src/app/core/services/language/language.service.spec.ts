import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  let service: LanguageService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({
          langs: { en: {}, el: {} },
          translocoConfig: {
            availableLangs: ['en', 'el'],
            defaultLang: 'en',
          },
        }),
      ],
    });

    service = TestBed.inject(LanguageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default to English', () => {
    expect(service.language()).toBe('en');
  });

  it('should toggle to Greek', () => {
    service.toggle();
    expect(service.language()).toBe('el');
  });

  it('should toggle back to English', () => {
    service.toggle();
    service.toggle();
    expect(service.language()).toBe('en');
  });

  it('should set a specific language', () => {
    service.set('el');
    expect(service.language()).toBe('el');
  });

  it('should persist preference to localStorage', () => {
    service.set('el');
    TestBed.flushEffects();
    expect(localStorage.getItem('language-preference')).toBe('el');
  });

  it('should update document lang attribute', () => {
    service.set('el');
    TestBed.flushEffects();
    expect(document.documentElement.lang).toBe('el');
  });
});

