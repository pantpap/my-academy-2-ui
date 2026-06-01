export interface NavigationSection {
  label: string;
  items: NavigationItem[];
}

interface NavigationItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
  badgeType?: 'danger' | 'warning';
}
