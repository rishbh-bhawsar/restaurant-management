import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService, ApiResponse } from '../../../core/api/api.service';
import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import { CatalogItem } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(private api: ApiService) {}

  getCatalogItems(offset: number = 0, limit: number = 10, type: string = 'all'): Observable<{ items: CatalogItem[]; total: number; hasMore: boolean }> {
    let endpoint = API_ENDPOINTS.CATALOG.ITEMS;
    if (type === 'products') endpoint = API_ENDPOINTS.CATALOG.PRODUCTS;
    if (type === 'ingredients') endpoint = API_ENDPOINTS.CATALOG.INGREDIENTS;
    if (type === 'preparations') endpoint = API_ENDPOINTS.CATALOG.PREPARATIONS;

    return this.api.get<any>(endpoint, { offset, limit }).pipe(
      map((res) => {
        const raw: any[] = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.items || []);
        const total = res.total || raw.length;

        if (raw.length > 0) {
          const items: CatalogItem[] = raw.map((r, i) => ({
            id: r.id || `cat_${offset + i}`,
            item_ref: r.item_ref || r.ref || `SKU-${2000 + offset + i}`,
            name: r.name || r.item_name || `Catalog Item ${offset + i + 1}`,
            category: r.category || 'General',
            unit: r.unit || 'Each',
            selling_price: Number(r.selling_price || r.price || 15.00),
            cost_price: Number(r.cost_price || 8.50),
            type: (r.type || 'Product') as any,
            status: 'Active',
            stock_quantity: Number(r.quantity || 24)
          }));
          return { items, total, hasMore: offset + items.length < total };
        }

        return this.getMockCatalog(offset, limit, type);
      }),
      catchError(() => of(this.getMockCatalog(offset, limit, type)))
    );
  }

  private getMockCatalog(offset: number, limit: number, type: string): { items: CatalogItem[]; total: number; hasMore: boolean } {
    const allMocks: CatalogItem[] = [
      { id: '1', item_ref: 'SKU-2001', name: 'Margherita Artisan Pizza', category: 'Pizza', unit: 'Each', selling_price: 14.50, cost_price: 4.80, type: 'Product', status: 'Active', stock_quantity: 45 },
      { id: '2', item_ref: 'SKU-2002', name: 'Truffle Mushroom Pizza', category: 'Pizza', unit: 'Each', selling_price: 18.00, cost_price: 6.20, type: 'Product', status: 'Active', stock_quantity: 32 },
      { id: '3', item_ref: 'SKU-2003', name: 'Smoked Angus Burger', category: 'Burgers', unit: 'Each', selling_price: 16.50, cost_price: 5.75, type: 'Product', status: 'Active', stock_quantity: 28 },
      { id: '4', item_ref: 'SKU-2004', name: 'Organic Mozzarella Ball', category: 'Dairy', unit: 'kg', selling_price: 0, cost_price: 9.50, type: 'Ingredient', status: 'Active', stock_quantity: 12 },
      { id: '5', item_ref: 'SKU-2005', name: 'Extra Virgin Olive Oil', category: 'Oils', unit: 'Liters', selling_price: 0, cost_price: 14.00, type: 'Ingredient', status: 'Active', stock_quantity: 8 },
      { id: '6', item_ref: 'SKU-2006', name: 'House Tomato Marinara Base', category: 'Sauces', unit: 'kg', selling_price: 0, cost_price: 3.20, type: 'Preparation', status: 'Active', stock_quantity: 18 },
      { id: '7', item_ref: 'SKU-2007', name: 'Crispy Calamari Fritti', category: 'Appetizers', unit: 'Each', selling_price: 11.00, cost_price: 3.80, type: 'Product', status: 'Active', stock_quantity: 50 },
      { id: '8', item_ref: 'SKU-2008', name: 'San Marzano Peeled Tomatoes', category: 'Canned Goods', unit: 'Cans', selling_price: 0, cost_price: 2.10, type: 'Ingredient', status: 'Active', stock_quantity: 60 },
      { id: '9', item_ref: 'SKU-2009', name: 'Fettuccine Creamy Alfredo', category: 'Mains', unit: 'Each', selling_price: 17.50, cost_price: 5.10, type: 'Product', status: 'Active', stock_quantity: 22 },
      { id: '10', item_ref: 'SKU-2010', name: 'Fresh Italian Basil Bunch', category: 'Herbs', unit: 'Bunch', selling_price: 0, cost_price: 1.50, type: 'Ingredient', status: 'Active', stock_quantity: 15 },
      { id: '11', item_ref: 'SKU-2011', name: 'Artisan Tiramisu Classico', category: 'Desserts', unit: 'Each', selling_price: 8.50, cost_price: 2.90, type: 'Product', status: 'Active', stock_quantity: 19 },
      { id: '12', item_ref: 'SKU-2012', name: 'Sparkling Berry Lemonade', category: 'Beverages', unit: 'Each', selling_price: 5.50, cost_price: 1.20, type: 'Product', status: 'Active', stock_quantity: 80 }
    ];

    const filtered = type === 'all' ? allMocks : allMocks.filter((m) => m.type.toLowerCase() === type.toLowerCase());
    const slice = filtered.slice(offset, offset + limit);
    return {
      items: slice,
      total: filtered.length,
      hasMore: offset + slice.length < filtered.length
    };
  }
}
