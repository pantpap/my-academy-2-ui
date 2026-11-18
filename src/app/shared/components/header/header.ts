import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { TranslocoDirective } from '@jsverse/transloco';
import { ThemeService } from '../../../core/services/theme/theme.service';
import { LanguageService, Language } from '../../../core/services/language/language.service';
import { SidebarState } from '../../../core/services/sidebar/sidebar-state';

@Component({
  selector: 'app-header',
  imports: [
    MatToolbar,
    MatIconButton,
    MatIcon,
    MatTooltip,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    TranslocoDirective,
  ],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private readonly themeService = inject(ThemeService);
  private readonly languageService = inject(LanguageService);
  private readonly sidebarState = inject(SidebarState);

  protected readonly isDark = this.themeService.isDark;
  protected readonly language = this.languageService.language;
  protected readonly sidebarCollapsed = this.sidebarState.collapsed;

  // Burger: ανοίγει/κλείνει το sidebar (SPEC-sidebar-collapse.md).
  protected toggleSidebar(): void {
    this.sidebarState.toggle();
  }

  protected toggleTheme(): void {
    this.themeService.toggle();
  }

  protected setLanguage(lang: Language): void {
    this.languageService.set(lang);
  }
}
