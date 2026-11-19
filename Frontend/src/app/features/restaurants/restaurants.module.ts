import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { RestaurantsRoutingModule } from './restaurants-routing.module';
import { RestaurantListComponent } from './pages/restaurant-list/restaurant-list.component';

@NgModule({
  declarations: [RestaurantListComponent],
  imports: [
    CommonModule,
    SharedModule,
    RestaurantsRoutingModule
  ]
})
export class RestaurantsModule {}
