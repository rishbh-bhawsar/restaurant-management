import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface RestaurantContext {
  entityId: number;
  branchId: number;
  restaurantUuid: string;
  restaurantName: string;
}

@Injectable({
  providedIn: 'root'
})
export class RestaurantContextService {
  private currentContextSignal = signal<RestaurantContext>({
    entityId: environment.defaultEntityId,
    branchId: environment.defaultBranchId,
    restaurantUuid: environment.defaultRestaurantUuid,
    restaurantName: 'Downtown Central Branch'
  });

  public readonly currentContext = this.currentContextSignal.asReadonly();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const saved = localStorage.getItem('restoflow_context');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.currentContextSignal.set(parsed);
      } catch (e) {
        console.error('Failed to parse restaurant context from localStorage', e);
      }
    }
  }

  setContext(context: Partial<RestaurantContext>): void {
    this.currentContextSignal.update((curr) => {
      const updated = { ...curr, ...context };
      localStorage.setItem('restoflow_context', JSON.stringify(updated));
      return updated;
    });
  }

  setRestaurant(restaurantUuid: string, restaurantName: string): void {
    this.setContext({ restaurantUuid, restaurantName });
  }

  setBranch(branchId: number, entityId?: number): void {
    this.setContext({ branchId, ...(entityId !== undefined ? { entityId } : {}) });
  }

  /**
   * Generates the backend's expected URL_PARAMETER string
   */
  buildUrlParameter(accessToken?: string): string {
    const ctx = this.currentContextSignal();
    const parts = [
      `URL_PATH=${environment.peckishApiUrl}`,
      `USERNAME=${environment.clientUser}`,
      `PASSWORD=${environment.clientSecret}`,
      `CLIENT_ID=${environment.clientId}`,
      `CLIENT_SECRET=${environment.clientSecret}`,
      `ACCESS_TOKEN=${accessToken || 'mock-token'}`,
      `RESTAURANT_UUID=${ctx.restaurantUuid}`,
      `ENTITY_ID=${ctx.entityId}`,
      `BRANCH_ID=${ctx.branchId}`
    ];
    return parts.join(':;:');
  }
}
