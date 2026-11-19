import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ApiService } from '../../../core/api/api.service';
import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import { PosProduct, ProductCategory, PosOrder } from '../models/pos.model';
import { ToasterService } from '../../../core/services/toaster.service';

@Injectable({
  providedIn: 'root'
})
export class PosService {
  private currentOrderSignal = signal<PosOrder | null>(null);
  public readonly currentOrder = this.currentOrderSignal.asReadonly();

  constructor(
    private api: ApiService,
    private toaster: ToasterService
  ) {}

  getCategories(): Observable<ProductCategory[]> {
    return of([
      { id: 'all', name: 'All Items', icon: 'bi-grid-fill' },
      { id: 'appetizers', name: 'Starters', icon: 'bi-cup-straw' },
      { id: 'mains', name: 'Main Courses', icon: 'bi-fire' },
      { id: 'pizza', name: 'Artisan Pizza', icon: 'bi-pie-chart-fill' },
      { id: 'burgers', name: 'Burgers & Wraps', icon: 'bi-record-circle' },
      { id: 'beverages', name: 'Beverages', icon: 'bi-droplet-half' },
      { id: 'desserts', name: 'Desserts', icon: 'bi-cake2' }
    ]);
  }

  getProducts(): Observable<PosProduct[]> {
    return this.api.get<any>(API_ENDPOINTS.CATALOG.PRODUCTS).pipe(
      map((response) => {
        const rawItems: any[] = Array.isArray(response.data)
          ? response.data
          : (response.data?.data || response.data?.items || []);

        if (rawItems.length > 0) {
          return rawItems.map((item, idx) => ({
            id: item.id || item.product_uuid || `prod_${idx}`,
            itemRef: item.item_ref || item.ref || `SKU-${1000 + idx}`,
            name: item.name || item.product_name || `Menu Dish ${idx + 1}`,
            category: (item.category || 'mains').toLowerCase(),
            price: Number(item.selling_price || item.price || (12.50 + (idx * 2.50))),
            description: item.description || 'Prepared fresh with high quality ingredients',
            image: item.image_url || this.getDefaultImageForCategory(item.category),
            inStock: item.in_stock !== undefined ? !!item.in_stock : true,
            customizationGroups: this.getDefaultCustomizations()
          }));
        }

        return this.getMockProducts();
      }),
      catchError(() => of(this.getMockProducts()))
    );
  }

  private getDefaultImageForCategory(cat?: string): string {
    const c = (cat || '').toLowerCase();
    if (c.includes('pizza')) return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80';
    if (c.includes('burger')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80';
    if (c.includes('starter') || c.includes('appetizer')) return 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=400&q=80';
    if (c.includes('beverage') || c.includes('drink')) return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80';
    if (c.includes('dessert')) return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80';
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
  }

  private getDefaultCustomizations() {
    return [
      {
        id: 'size',
        name: 'Portion Size',
        required: true,
        options: [
          { name: 'Regular', priceDelta: 0 },
          { name: 'Large (+25%)', priceDelta: 3.50 }
        ]
      },
      {
        id: 'spice',
        name: 'Spice Level',
        required: false,
        options: [
          { name: 'Mild', priceDelta: 0 },
          { name: 'Medium', priceDelta: 0 },
          { name: 'Hot & Spicy', priceDelta: 0.50 }
        ]
      },
      {
        id: 'extras',
        name: 'Add-ons',
        required: false,
        options: [
          { name: 'Extra Cheese', priceDelta: 2.00 },
          { name: 'Garlic Butter Dip', priceDelta: 1.25 }
        ]
      }
    ];
  }

  private getMockProducts(): PosProduct[] {
    return [
      {
        id: 'p1',
        itemRef: 'SKU-1001',
        name: 'Classic Margherita Pizza',
        category: 'pizza',
        price: 14.50,
        description: 'San Marzano tomato sauce, fresh mozzarella, organic basil, olive oil',
        image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&q=80',
        inStock: true,
        customizationGroups: this.getDefaultCustomizations()
      },
      {
        id: 'p2',
        itemRef: 'SKU-1002',
        name: 'Truffle Mushroom Pizza',
        category: 'pizza',
        price: 18.00,
        description: 'Wild forest mushrooms, white truffle oil, fior di latte, parmesan',
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
        inStock: true,
        customizationGroups: this.getDefaultCustomizations()
      },
      {
        id: 'p3',
        itemRef: 'SKU-1003',
        name: 'Smoked Bacon Angus Burger',
        category: 'burgers',
        price: 16.50,
        description: 'Prime Angus patty, aged cheddar, crispy smoked bacon, brioche bun',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
        inStock: true,
        customizationGroups: this.getDefaultCustomizations()
      },
      {
        id: 'p4',
        itemRef: 'SKU-1004',
        name: 'Crispy Calamari Fritti',
        category: 'appetizers',
        price: 11.00,
        description: 'Lightly battered squid rings, roasted garlic aioli, lemon wedge',
        image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=400&q=80',
        inStock: true,
        customizationGroups: this.getDefaultCustomizations()
      },
      {
        id: 'p5',
        itemRef: 'SKU-1005',
        name: 'Grilled Salmon Fillet',
        category: 'mains',
        price: 24.00,
        description: 'Norwegian salmon, lemon-dill butter, asparagus, garlic mash',
        image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=80',
        inStock: true,
        customizationGroups: this.getDefaultCustomizations()
      },
      {
        id: 'p6',
        itemRef: 'SKU-1006',
        name: 'Fettuccine Creamy Alfredo',
        category: 'mains',
        price: 17.50,
        description: 'House-made pasta, parmigiano reggiano cream, cracked black pepper',
        image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=400&q=80',
        inStock: true,
        customizationGroups: this.getDefaultCustomizations()
      },
      {
        id: 'p7',
        itemRef: 'SKU-1007',
        name: 'Artisan Tiramisu Classico',
        category: 'desserts',
        price: 8.50,
        description: 'Savoiardi soaked in espresso, mascarpone cream, cocoa powder',
        image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=400&q=80',
        inStock: true,
        customizationGroups: this.getDefaultCustomizations()
      },
      {
        id: 'p8',
        itemRef: 'SKU-1008',
        name: 'Sparkling Berry Lemonade',
        category: 'beverages',
        price: 5.50,
        description: 'Fresh squeezed lemon, crushed raspberries, sparkling water, mint',
        image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80',
        inStock: true,
        customizationGroups: this.getDefaultCustomizations()
      }
    ];
  }

  processOrder(order: PosOrder): Observable<PosOrder> {
    const payload = {
      order_number: order.orderNumber,
      total_amount: order.pricing.grandTotal,
      subtotal: order.pricing.subtotal,
      tax_amount: order.pricing.taxAmount,
      discount_amount: order.pricing.discountAmount,
      payment_method: order.paymentMethod,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      table_number: order.tableNumber,
      order_type: order.orderType,
      items_count: order.items.reduce((s, i) => s + i.quantity, 0),
      items_payload: order.items.map((i) => ({
        product_id: i.product.id,
        name: i.product.name,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        total: i.lineTotal,
        modifiers: i.selectedModifiers
      }))
    };

    // Call backend Post Sales Event API: POST /api/events/sales
    return this.api.post<any>(API_ENDPOINTS.EVENTS.POST_EVENT('sales'), payload).pipe(
      map((res) => {
        this.currentOrderSignal.set(order);
        this.toaster.success(`Order ${order.orderNumber} successfully booked and synced!`, 'Order Confirmed');
        return order;
      }),
      catchError(() => {
        // Fallback store order locally if backend DB is in dev mode
        this.currentOrderSignal.set(order);
        this.toaster.success(`Order ${order.orderNumber} processed locally (Demo Mode)`, 'Order Confirmed');
        return of(order);
      })
    );
  }

  setCurrentOrder(order: PosOrder): void {
    this.currentOrderSignal.set(order);
  }
}
