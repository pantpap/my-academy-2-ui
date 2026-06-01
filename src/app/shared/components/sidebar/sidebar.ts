import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavigationSection } from '../../../common/interfaces/navigation';


@Component({
  selector: 'app-sidebar',
  imports: [MatIcon, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  sections: NavigationSection[] = [
    {
      label: 'Κύριο',
      items: [
        { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
        { label: 'Πελάτες', icon: 'group', route: '/clients' },
        { label: 'Πληρωμές', icon: 'payments', route: '/payments' },
        {
          label: 'Εκκρεμή',
          icon: 'pending_actions',
          route: '/pending',
          badge: 0,
          badgeType: 'danger',
        },
        {
          label: 'Ληξιπρόθεσμα',
          icon: 'schedule',
          route: '/overdue',
          badge: 4,
          badgeType: 'warning',
        },
      ],
    },
    {
      label: 'Αναλύσεις',
      items: [
        { label: 'Αναφορές', icon: 'bar_chart', route: '/reports' },
        { label: 'Ιστορικό', icon: 'history', route: '/history' },
      ],
    },
    {
      label: 'Σύστημα',
      items: [
        {
          label: 'Ειδοποιήσεις',
          icon: 'notifications',
          route: '/notifications',
          badge: 3,
          badgeType: 'danger',
        },
        { label: 'Ρυθμίσεις', icon: 'settings', route: '/settings' },
      ],
    },
  ];
}
