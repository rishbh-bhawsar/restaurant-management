import { Injectable } from '@angular/core';
import { CartItem, OrderPricing, SelectedModifier } from '../models/pos.model';

@Injectable({
  providedIn: 'root'
})
export class PricingService {
  private readonly DEFAULT_TAX_RATE = 0.0825; // 8.25%

  calculateItemUnitPrice(basePrice: number, modifiers: SelectedModifier[]): number {
    const modifierSum = modifiers.reduce((acc, mod) => acc + (mod.priceDelta || 0), 0);
    return Number((basePrice + modifierSum).toFixed(2));
  }

  calculateLineTotal(unitPrice: number, quantity: number): number {
    return Number((unitPrice * quantity).toFixed(2));
  }

  calculateOrderPricing(items: CartItem[], discountRate: number = 0, taxRate: number = this.DEFAULT_TAX_RATE): OrderPricing {
    const subtotal = items.reduce((acc, item) => acc + item.lineTotal, 0);
    const discountAmount = Number((subtotal * discountRate).toFixed(2));
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = Number((taxableAmount * taxRate).toFixed(2));
    const grandTotal = Number((taxableAmount + taxAmount).toFixed(2));

    return {
      subtotal: Number(subtotal.toFixed(2)),
      discountRate,
      discountAmount,
      taxRate,
      taxAmount,
      grandTotal
    };
  }
}
