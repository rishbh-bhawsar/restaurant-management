import { Component, EventEmitter, Output } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { RestaurantContextService, RestaurantContext } from '../../../../core/services/restaurant-context.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false
})
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  // Available demo restaurant locations matching Peckish backend multi-tenancy
  branches = [
    { name: 'Downtown Central Branch', uuid: 'rest-uuid-demo-1', entityId: 1, branchId: 1 },
    { name: 'Uptown Bistro & Lounge', uuid: 'rest-uuid-demo-2', entityId: 1, branchId: 2 },
    { name: 'West End Express POS', uuid: 'rest-uuid-demo-3', entityId: 2, branchId: 1 }
  ];

  isUserMenuOpen = false;
  isBranchMenuOpen = false;

  constructor(
    public authService: AuthService,
    public contextService: RestaurantContextService,
    private router: Router
  ) {}

  switchBranch(branch: typeof this.branches[0]): void {
    this.contextService.setRestaurant(branch.uuid, branch.name);
    this.contextService.setBranch(branch.branchId, branch.entityId);
    this.isBranchMenuOpen = false;
  }

  logout(): void {
    this.authService.logout();
  }

  navigateToPos(): void {
    this.router.navigate(['/pos/terminal']);
  }
}
