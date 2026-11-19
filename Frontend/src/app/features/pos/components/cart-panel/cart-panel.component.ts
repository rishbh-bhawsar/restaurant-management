import { Component, EventEmitter, Output } from '@angular/core';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart-panel',
  templateUrl: './cart-panel.component.html',
  styleUrls: ['./cart-panel.component.scss'],
  standalone: false
})
export class CartPanelComponent {
  @Output() proceedToCheckout = new EventEmitter<void>();

  orderType: 'Dine-In' | 'Takeaway' | 'Delivery' = 'Dine-In';

  constructor(public cartService: CartService) {}

  onIncrement(cartItemId: string): void {
    this.cartService.updateQuantity(cartItemId, 1);
  }

  onDecrement(cartItemId: string): void {
    this.cartService.updateQuantity(cartItemId, -1);
  }

  onRemove(cartItemId: string): void {
    this.cartService.removeItem(cartItemId);
  }

  onClear(): void {
    this.cartService.clearCart();
  }

  onCheckout(): void {
    this.proceedToCheckout.emit();
  }
}
