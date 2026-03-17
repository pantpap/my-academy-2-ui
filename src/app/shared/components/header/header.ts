import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-header',
  imports: [MatToolbar, MatIconButton, MatIcon, MatTooltip],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private readonly themeService = inject(ThemeService);

  protected readonly isDark = this.themeService.isDark;

  protected toggleTheme(): void {
    this.themeService.toggle();
  }
}
