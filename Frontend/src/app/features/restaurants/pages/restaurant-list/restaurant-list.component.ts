import { Component, OnInit } from '@angular/core';
import { RestaurantService } from '../../services/restaurant.service';
import { RestaurantLocation } from '../../models/restaurant.model';
import { RestaurantContextService } from '../../../../core/services/restaurant-context.service';
import { ToasterService } from '../../../../core/services/toaster.service';

@Component({
  selector: 'app-restaurant-list',
  templateUrl: './restaurant-list.component.html',
  styleUrls: ['./restaurant-list.component.scss'],
  standalone: false
})
export class RestaurantListComponent implements OnInit {
  restaurants: RestaurantLocation[] = [];
  loading = false;

  constructor(
    private restaurantService: RestaurantService,
    public contextService: RestaurantContextService,
    private toaster: ToasterService
  ) {}

  ngOnInit(): void {
    this.loadRestaurants();
  }

  loadRestaurants(): void {
    this.loading = true;
    this.restaurantService.getRestaurants().subscribe({
      next: (list) => {
        this.restaurants = list;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toaster.error('Failed to load restaurant locations from backend.', 'Error');
      }
    });
  }

  setActiveBranch(branch: RestaurantLocation): void {
    this.contextService.setRestaurant(branch.restaurant_uuid, branch.name);
    this.contextService.setBranch(branch.branch_id, branch.entity_id);
    this.toaster.success(`Active branch switched to "${branch.name}"`, 'Branch Updated');
  }
}
