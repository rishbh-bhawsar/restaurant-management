export interface RestaurantLocation {
  id: string;
  restaurant_uuid: string;
  name: string;
  entity_id: number;
  branch_id: number;
  address: string;
  city: string;
  state: string;
  phone: string;
  currency: string;
  is_active: boolean;
  terminals_count: number;
}
