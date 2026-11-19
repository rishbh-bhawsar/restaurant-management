export interface CatalogItem {
  id: string;
  item_ref: string;
  name: string;
  category: string;
  unit: string;
  selling_price: number;
  cost_price: number;
  type: 'Item' | 'Product' | 'Ingredient' | 'Preparation';
  status: 'Active' | 'Inactive';
  stock_quantity?: number;
}
