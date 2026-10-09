import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialog, ConfirmDialogData } from './confirm-dialog';

describe('ConfirmDialog', () => {
  const data: ConfirmDialogData = {
    title: 'Discard changes?',
    message: 'Your changes will be lost.',
    confirmLabel: 'Discard',
    cancelLabel: 'Keep editing',
  };
  let close: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    close = vi.fn();
    await TestBed.configureTestingModule({
      imports: [ConfirmDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close } },
      ],
    }).compileComponents();
  });

  function render() {
    const fixture = TestBed.createComponent(ConfirmDialog);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the title, message and both labels', () => {
    const element = render();

    expect(element.textContent).toContain('Discard changes?');
    expect(element.textContent).toContain('Your changes will be lost.');
    expect(element.querySelector('[data-testid="confirm"]')!.textContent).toContain('Discard');
    expect(element.querySelector('[data-testid="cancel"]')!.textContent).toContain('Keep editing');
  });

  it('closes with true on confirm and false on cancel', () => {
    const element = render();

    (element.querySelector('[data-testid="confirm"]') as HTMLElement).click();
    (element.querySelector('[data-testid="cancel"]') as HTMLElement).click();

    expect(close.mock.calls).toEqual([[true], [false]]);
  });
});
