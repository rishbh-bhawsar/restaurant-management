export interface SalesEvent {
  id: string;
  order_number: string;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  payment_method: 'Card' | 'Cash' | 'UPI' | 'Split';
  items_count: number;
  customer_name?: string;
  created_at: string;
  status: string;
}
