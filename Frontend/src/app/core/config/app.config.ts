import { environment } from '../../../environments/environment';

export interface AppConfig {
  appName: string;
  version: string;
  apiUrl: string;
  peckishApiUrl: string;
  defaultEntityId: number;
  defaultBranchId: number;
  defaultRestaurantUuid: string;
}

export const APP_CONFIG: AppConfig = {
  appName: 'RestoFlow POS & Integration',
  version: '1.0.0',
  apiUrl: environment.apiUrl,
  peckishApiUrl: environment.peckishApiUrl,
  defaultEntityId: environment.defaultEntityId,
  defaultBranchId: environment.defaultBranchId,
  defaultRestaurantUuid: environment.defaultRestaurantUuid
};
