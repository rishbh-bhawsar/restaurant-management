import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '../../../core/api/api.service';
import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import { RestaurantLocation } from '../models/restaurant.model';

@Injectable({
  providedIn: 'root'
})
export class RestaurantService {
  constructor(private api: ApiService) {}

  getRestaurants(): Observable<RestaurantLocation[]> {
    return this.api.get<any>(API_ENDPOINTS.RESTAURANTS.BASE).pipe(
      map((res) => {
        const raw: any[] = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.restaurants || []);
        if (raw.length > 0) {
          return raw.map((r, i) => ({
            id: r.id || `rest_${i}`,
            restaurant_uuid: r.restaurant_uuid || r.uuid || `rest-uuid-demo-${i + 1}`,
            name: r.name || r.restaurant_name || `Restaurant Branch ${i + 1}`,
            entity_id: Number(r.entity_id || 1),
            branch_id: Number(r.branch_id || i + 1),
            address: r.address || '104 Main Street',
            city: r.city || 'Austin',
            state: r.state || 'TX',
            phone: r.phone || '+1 (512) 555-0199',
            currency: r.currency || 'USD',
            is_active: r.is_active !== undefined ? !!r.is_active : true,
            terminals_count: r.terminals_count || 3
          }));
        }
        return this.getMockRestaurants();
      }),
      catchError(() => of(this.getMockRestaurants()))
    );
  }

  private getMockRestaurants(): RestaurantLocation[] {
    return [
      {
        id: '1',
        restaurant_uuid: 'rest-uuid-demo-1',
        name: 'Downtown Central Branch',
        entity_id: 1,
        branch_id: 1,
        address: '500 Congress Ave',
        city: 'Austin',
        state: 'TX',
        phone: '+1 (512) 555-0101',
        currency: 'USD',
        is_active: true,
        terminals_count: 4
      },
      {
        id: '2',
        restaurant_uuid: 'rest-uuid-demo-2',
        name: 'Uptown Bistro & Lounge',
        entity_id: 1,
        branch_id: 2,
        address: '3200 Palm Way Suite 120',
        city: 'Austin',
        state: 'TX',
        phone: '+1 (512) 555-0144',
        currency: 'USD',
        is_active: true,
        terminals_count: 2
      },
      {
        id: '3',
        restaurant_uuid: 'rest-uuid-demo-3',
        name: 'West End Express POS',
        entity_id: 2,
        branch_id: 1,
        address: '1100 S Lamar Blvd',
        city: 'Austin',
        state: 'TX',
        phone: '+1 (512) 555-0188',
        currency: 'USD',
        is_active: true,
        terminals_count: 1
      }
    ];
  }
}
