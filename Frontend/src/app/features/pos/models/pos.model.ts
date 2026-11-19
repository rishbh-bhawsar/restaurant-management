export interface ProductCategory {
  id: string;
  name: string;
  icon?: string;
}

export interface ProductCustomizationOption {
  name: string;
  priceDelta: number;
}

export interface ProductCustomizationGroup {
  id: string;
  name: string;
  required: boolean;
  options: ProductCustomizationOption[];
}

export interface PosProduct {
  id: string;
  itemRef?: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  image?: string;
  inStock: boolean;
  customizationGroups?: ProductCustomizationGroup[];
}

export interface SelectedModifier {
  groupName: string;
  optionName: string;
  priceDelta: number;
}

export interface CartItem {
  id: string; // unique cart item id
  product: PosProduct;
  quantity: number;
  selectedModifiers: SelectedModifier[];
  specialInstructions?: string;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderPricing {
  subtotal: number;
  discountRate: number; // e.g. 0.05 for 5%
  discountAmount: number;
  taxRate: number; // e.g. 0.08 for 8%
  taxAmount: number;
  grandTotal: number;
}

export type PaymentMethod = 'Cash' | 'Card' | 'UPI' | 'Split';

export interface PosOrder {
  id: string;
  orderNumber: string;
  items: CartItem[];
  pricing: OrderPricing;
  paymentMethod: PaymentMethod;
  amountTendered?: number;
  changeDue?: number;
  customerName?: string;
  customerPhone?: string;
  tableNumber?: string;
  orderType: 'Dine-In' | 'Takeaway' | 'Delivery';
  status: 'Completed' | 'Pending' | 'Cancelled';
  createdAt: string;
  notes?: string;
}
