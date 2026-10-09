import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { MatIcon } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavigationSection } from '../../../common/interfaces/navigation';
import { LocalStorage } from '../../../core/services/localStorage/local-storage';
import { ORGANIZATION } from '../../../common/constants/local-storage-constants';
import { Organization } from '../../../common/interfaces/organization';

const SETTINGS_SECTION: NavigationSection = {
  label: 'sidebar.sections.system',
  items: [
    // {
    //   label: 'Ειδοποιήσεις',
    //   icon: 'notifications',
    //   route: 'notifications',
    //   badge: 3,
    //   badgeType: 'danger',
    // },
    { label: 'sidebar.settings', icon: 'settings', route: 'settings' },
  ],
};

const ORGANIZATION_SECTIONS: NavigationSection[] = [
  {
    label: 'sidebar.sections.main',
    items: [
      { label: 'sidebar.dashboard', icon: 'dashboard', route: 'dashboard' },
      { label: 'sidebar.customers', icon: 'group', route: 'customers' },
      { label: 'sidebar.payments', icon: 'payments', route: 'payments' },
      { label: 'sidebar.events', icon: 'pending_actions', route: 'events' },
      // {
      //   label: 'Ληξιπρόθεσμα',
      //   icon: 'schedule',
      //   route: 'overdue',
      //   badge: 4,
      //   badgeType: 'warning',
      // },
    ],
  },
  // {
  //   label: 'Αναλύσεις',
  //   items: [
  //     { label: 'Αναφορές', icon: 'bar_chart', route: 'reports' },
  //     { label: 'Ιστορικό', icon: 'history', route: 'history' },
  //   ],
  // },
  SETTINGS_SECTION,
];

const ADMIN_SECTIONS: NavigationSection[] = [
  {
    label: 'sidebar.sections.main',
    items: [
      { label: 'sidebar.dashboard', icon: 'dashboard', route: 'dashboard' },
      { label: 'sidebar.organizations', icon: 'corporate_fare', route: 'organizations' },
      { label: 'sidebar.payments', icon: 'payments', route: 'payments' },
    ],
  },
  SETTINGS_SECTION,
];

@Component({
  selector: 'app-sidebar',
  imports: [MatIcon, RouterLink, RouterLinkActive, TranslocoDirective],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  private readonly localStorageService = inject(LocalStorage);

  readonly userData = signal(this.localStorageService.getItem<Organization | null>(ORGANIZATION));
  readonly initials = signal(this.userData()?.name?.[0] ?? '');

  // Οι ετικέτες είναι κλειδιά transloco (Q7). Ο admin βλέπει άλλες σελίδες από τον
  // οργανισμό (SPEC-organizations-admin.md, Κομμάτι 5).
  readonly sections: NavigationSection[] =
    this.userData()?.role === 'admin' ? ADMIN_SECTIONS : ORGANIZATION_SECTIONS;
}
