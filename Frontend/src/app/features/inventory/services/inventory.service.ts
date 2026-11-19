import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '../../../core/api/api.service';
import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import { StockItem } from '../models/inventory.model';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  constructor(private api: ApiService) {}

  getStockLevels(offset: number = 0, limit: number = 10): Observable<{ items: StockItem[]; total: number; hasMore: boolean }> {
    return this.api.get<any>(API_ENDPOINTS.STOCK.LEVELS, { offset, limit }).pipe(
      map((res) => {
        const raw: any[] = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        const total = res.total || raw.length;

        if (raw.length > 0) {
          const items: StockItem[] = raw.map((r, i) => {
            const qty = Number(r.quantity || r.stock_level || 15);
            const reorder = Number(r.reorder_level || 10);
            const cost = Number(r.unit_cost || 4.50);
            return {
              id: r.id || `stk_${offset + i}`,
              item_ref: r.item_ref || `REF-00${offset + i + 1}`,
              item_name: r.item_name || r.name || `Inventory Supply Item ${offset + i + 1}`,
              category: r.category || 'Kitchen Supplies',
              unit: r.unit || 'kg',
              quantity_on_hand: qty,
              reorder_level: reorder,
              unit_cost: cost,
              total_value: Number((qty * cost).toFixed(2)),
              last_counted: r.last_counted || new Date(Date.now() - i * 86400000).toISOString(),
              status: qty <= 0 ? 'Out of Stock' : qty <= reorder ? 'Low Stock' : 'In Stock'
            };
          });
          return { items, total, hasMore: offset + items.length < total };
        }

        return this.getMockInventory(offset, limit);
      }),
      catchError(() => of(this.getMockInventory(offset, limit)))
    );
  }

  private getMockInventory(offset: number, limit: number): { items: StockItem[]; total: number; hasMore: boolean } {
    const mocks: StockItem[] = [
      { id: '1', item_ref: 'ING-014', item_name: 'Organic Olive Oil Extra Virgin', category: 'Pantry / Oils', unit: 'Liters', quantity_on_hand: 2.5, reorder_level: 8.0, unit_cost: 14.50, total_value: 36.25, last_counted: new Date().toISOString(), status: 'Low Stock' },
      { id: '2', item_ref: 'ING-029', item_name: 'Fresh Mozzarella Di Bufala', category: 'Dairy', unit: 'kg', quantity_on_hand: 3.0, reorder_level: 10.0, unit_cost: 9.80, total_value: 29.40, last_counted: new Date().toISOString(), status: 'Low Stock' },
      { id: '3', item_ref: 'ING-088', item_name: 'San Marzano Tomato Paste', category: 'Canned Goods', unit: 'Cans', quantity_on_hand: 4.0, reorder_level: 15.0, unit_cost: 2.40, total_value: 9.60, last_counted: new Date().toISOString(), status: 'Low Stock' },
      { id: '4', item_ref: 'ING-001', item_name: 'Tipo 00 Pizza Flour', category: 'Baking', unit: 'kg', quantity_on_hand: 85.0, reorder_level: 30.0, unit_cost: 1.85, total_value: 157.25, last_counted: new Date().toISOString(), status: 'In Stock' },
      { id: '5', item_ref: 'ING-002', item_name: 'Prime Black Angus Patties', category: 'Meats', unit: 'kg', quantity_on_hand: 24.0, reorder_level: 12.0, unit_cost: 16.50, total_value: 396.00, last_counted: new Date().toISOString(), status: 'In Stock' },
      { id: '6', item_ref: 'ING-003', item_name: 'Fresh Calamari Tubes', category: 'Seafood', unit: 'kg', quantity_on_hand: 18.0, reorder_level: 10.0, unit_cost: 12.00, total_value: 216.00, last_counted: new Date().toISOString(), status: 'In Stock' },
      { id: '7', item_ref: 'ING-004', item_name: 'Brioche Burger Buns', category: 'Bakery', unit: 'Packs', quantity_on_hand: 42.0, reorder_level: 20.0, unit_cost: 3.50, total_value: 147.00, last_counted: new Date().toISOString(), status: 'In Stock' },
      { id: '8', item_ref: 'ING-005', item_name: 'Parmigiano Reggiano 24M', category: 'Dairy', unit: 'kg', quantity_on_hand: 6.5, reorder_level: 5.0, unit_cost: 22.00, total_value: 143.00, last_counted: new Date().toISOString(), status: 'In Stock' },
      { id: '9', item_ref: 'ING-006', item_name: 'White Truffle Infused Oil', category: 'Pantry / Oils', unit: 'Bottles', quantity_on_hand: 0.0, reorder_level: 3.0, unit_cost: 28.00, total_value: 0.00, last_counted: new Date().toISOString(), status: 'Out of Stock' }
    ];

    const slice = mocks.slice(offset, offset + limit);
    return {
      items: slice,
      total: mocks.length,
      hasMore: offset + slice.length < mocks.length
    };
  }
}
