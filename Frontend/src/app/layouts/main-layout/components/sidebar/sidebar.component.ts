import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: false
})
export class SidebarComponent {
  @Input() isCollapsed: boolean = false;
  @Output() closeMobileSidebar = new EventEmitter<void>();

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'bi-grid-1x2', route: '/dashboard' },
    { label: 'POS Terminal', icon: 'bi-cart-check', route: '/pos/terminal', badge: 'Live' },
    { label: 'Products & Menu', icon: 'bi-egg-fried', route: '/products' },
    { label: 'Sales & Events', icon: 'bi-receipt', route: '/sales' },
    { label: 'Inventory & Stock', icon: 'bi-boxes', route: '/inventory' },
    { label: 'Restaurants', icon: 'bi-buildings', route: '/restaurants' }
  ];

  constructor(public authService: AuthService) {}

  onNavClick(): void {
    this.closeMobileSidebar.emit();
  }

  logout(): void {
    this.authService.logout();
  }
}
