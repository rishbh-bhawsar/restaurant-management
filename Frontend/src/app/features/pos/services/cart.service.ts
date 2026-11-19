import { Injectable, computed, signal } from '@angular/core';
import { CartItem, OrderPricing, PosProduct, SelectedModifier } from '../models/pos.model';
import { PricingService } from './pricing.service';
import { ToasterService } from '../../../core/services/toaster.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private itemsSignal = signal<CartItem[]>([]);
  public readonly items = this.itemsSignal.asReadonly();

  private discountRateSignal = signal<number>(0);
  public readonly discountRate = this.discountRateSignal.asReadonly();

  public readonly itemCount = computed(() =>
    this.itemsSignal().reduce((acc, item) => acc + item.quantity, 0)
  );

  public readonly pricing = computed<OrderPricing>(() =>
    this.pricingService.calculateOrderPricing(this.itemsSignal(), this.discountRateSignal())
  );

  constructor(
    private pricingService: PricingService,
    private toaster: ToasterService
  ) {
    this.loadCart();
  }

  private loadCart(): void {
    const saved = sessionStorage.getItem('restoflow_pos_cart');
    if (saved) {
      try {
        this.itemsSignal.set(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
  }

  private persistCart(): void {
    sessionStorage.setItem('restoflow_pos_cart', JSON.stringify(this.itemsSignal()));
  }

  addToCart(product: PosProduct, modifiers: SelectedModifier[] = [], instructions?: string): void {
    const unitPrice = this.pricingService.calculateItemUnitPrice(product.price, modifiers);
    const existingIndex = this.findExistingItemIndex(product.id, modifiers, instructions);

    if (existingIndex > -1) {
      this.itemsSignal.update((current) => {
        const updated = [...current];
        const item = updated[existingIndex];
        const newQty = item.quantity + 1;
        updated[existingIndex] = {
          ...item,
          quantity: newQty,
          lineTotal: this.pricingService.calculateLineTotal(item.unitPrice, newQty)
        };
        return updated;
      });
    } else {
      const newItem: CartItem = {
        id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        product,
        quantity: 1,
        selectedModifiers: modifiers,
        specialInstructions: instructions,
        unitPrice,
        lineTotal: unitPrice
      };
      this.itemsSignal.update((current) => [...current, newItem]);
    }

    this.persistCart();
    this.toaster.info(`Added "${product.name}" to cart`, 'Cart Updated', 2000);
  }

  updateQuantity(cartItemId: string, delta: number): void {
    this.itemsSignal.update((current) => {
      return current
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              lineTotal: this.pricingService.calculateLineTotal(item.unitPrice, newQty)
            };
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });
    this.persistCart();
  }

  removeItem(cartItemId: string): void {
    this.itemsSignal.update((current) => current.filter((item) => item.id !== cartItemId));
    this.persistCart();
  }

  clearCart(): void {
    this.itemsSignal.set([]);
    sessionStorage.removeItem('restoflow_pos_cart');
  }

  setDiscountRate(rate: number): void {
    this.discountRateSignal.set(rate);
  }

  private findExistingItemIndex(productId: string, modifiers: SelectedModifier[], instructions?: string): number {
    return this.itemsSignal().findIndex((item) => {
      if (item.product.id !== productId) return false;
      if ((item.specialInstructions || '') !== (instructions || '')) return false;
      if (item.selectedModifiers.length !== modifiers.length) return false;

      return modifiers.every((m) =>
        item.selectedModifiers.some(
          (im) => im.groupName === m.groupName && im.optionName === m.optionName
        )
      );
    });
  }
}
