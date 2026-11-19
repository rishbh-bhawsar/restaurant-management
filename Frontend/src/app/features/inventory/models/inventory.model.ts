export interface StockItem {
  id: string;
  item_ref: string;
  item_name: string;
  category: string;
  unit: string;
  quantity_on_hand: number;
  reorder_level: number;
  unit_cost: number;
  total_value: number;
  last_counted: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export interface StocktakeLog {
  id: string;
  stocktake_uuid: string;
  date: string;
  performed_by: string;
  items_counted: number;
  variance_value: number;
  status: 'Completed' | 'Pending Review';
}
