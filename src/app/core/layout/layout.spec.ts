import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { Layout } from './layout';

describe('Layout', () => {
  let component: Layout;
  let fixture: ComponentFixture<Layout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Layout,
        TranslocoTestingModule.forRoot({
          langs: { en: {} },
          translocoConfig: { availableLangs: ['en', 'el'], defaultLang: 'en' },
        }),
      ],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Layout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // SPEC-sidebar-collapse.md: το sidebar είναι δίπλα στο περιεχόμενο μόνο από xl και πάνω
  // (από κάτω οι πίνακες ξεχειλίζουν, απόφαση 2026-11-18).
  it('βάζει το sidebar δίπλα στο περιεχόμενο μόνο από xl και πάνω', () => {
    const root: HTMLElement = fixture.nativeElement.firstElementChild;
    expect(root.classList).toContain('xl:flex');
    expect(root.classList).not.toContain('flex');
  });

  it('το sidebar δεν συρρικνώνεται όταν το περιεχόμενο είναι φαρδύ', () => {
    const sidebarWrapper = fixture.nativeElement.querySelector('app-sidebar').parentElement;
    expect(sidebarWrapper.classList).toContain('shrink-0');
  });
});
