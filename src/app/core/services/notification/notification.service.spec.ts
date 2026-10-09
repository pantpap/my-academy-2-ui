import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let snackBar: { open: ReturnType<typeof vi.fn> };
  let service: NotificationService;

  beforeEach(() => {
    snackBar = { open: vi.fn() };
    TestBed.configureTestingModule({ providers: [{ provide: MatSnackBar, useValue: snackBar }] });
    service = TestBed.inject(NotificationService);
  });

  it('success() opens a snack bar with the success style', () => {
    service.success('Saved');

    expect(snackBar.open).toHaveBeenCalledWith(
      'Saved',
      undefined,
      expect.objectContaining({ panelClass: ['notification-success'] }),
    );
  });

  it('error() opens a snack bar with the error style', () => {
    service.error('Failed');

    expect(snackBar.open).toHaveBeenCalledWith(
      'Failed',
      undefined,
      expect.objectContaining({ panelClass: ['notification-error'] }),
    );
  });
});
