export interface DashboardStats {
  todaySales: number;
  totalOrders: number;
  activeItems: number;
  lowStockCount: number;
  salesGrowth: string;
  orderGrowth: string;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  itemsCount: number;
  totalAmount: number;
  paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Online';
  status: 'Completed' | 'Pending' | 'Preparing';
  createdAt: string;
}

export interface LowStockItem {
  id: string;
  itemRef: string;
  itemName: string;
  category: string;
  currentQuantity: number;
  reorderLevel: number;
  unit: string;
}
