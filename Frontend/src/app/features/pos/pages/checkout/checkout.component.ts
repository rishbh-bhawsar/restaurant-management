import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { PosService } from '../../services/pos.service';
import { PaymentMethod, PosOrder } from '../../models/pos.model';
import { ToasterService } from '../../../../core/services/toaster.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  standalone: false
})
export class CheckoutComponent implements OnInit {
  paymentMethod: PaymentMethod = 'Card';
  amountTendered: number = 0;
  changeDue: number = 0;

  customerName: string = '';
  customerPhone: string = '';
  tableNumber: string = 'T-04';
  orderType: 'Dine-In' | 'Takeaway' | 'Delivery' = 'Dine-In';
  notes: string = '';

  isProcessing: boolean = false;

  quickCashAmounts = [10, 20, 50, 100];

  constructor(
    public cartService: CartService,
    private posService: PosService,
    private router: Router,
    private toaster: ToasterService
  ) {}

  ngOnInit(): void {
    if (this.cartService.items().length === 0) {
      this.toaster.warning('Your cart is empty. Please select dishes first.', 'Cart Empty');
      this.router.navigate(['/pos/terminal']);
      return;
    }

    this.amountTendered = this.cartService.pricing().grandTotal;
    this.calculateChange();
  }

  selectPaymentMethod(method: PaymentMethod): void {
    this.paymentMethod = method;
    if (method === 'Cash') {
      this.amountTendered = this.cartService.pricing().grandTotal;
      this.calculateChange();
    }
  }

  setTenderedAmount(amount: number): void {
    this.amountTendered = amount;
    this.calculateChange();
  }

  addTenderedCash(addition: number): void {
    this.amountTendered = Number((this.amountTendered + addition).toFixed(2));
    this.calculateChange();
  }

  setExactAmount(): void {
    this.amountTendered = this.cartService.pricing().grandTotal;
    this.calculateChange();
  }

  onTenderedInput(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.amountTendered = isNaN(val) ? 0 : val;
    this.calculateChange();
  }

  calculateChange(): void {
    const total = this.cartService.pricing().grandTotal;
    this.changeDue = Math.max(0, Number((this.amountTendered - total).toFixed(2)));
  }

  backToTerminal(): void {
    this.router.navigate(['/pos/terminal']);
  }

  submitPayment(): void {
    const total = this.cartService.pricing().grandTotal;

    if (this.paymentMethod === 'Cash' && this.amountTendered < total) {
      this.toaster.warning('Tendered cash is less than total amount.', 'Payment Insufficient');
      return;
    }

    this.isProcessing = true;
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    const order: PosOrder = {
      id: `ord_${Date.now()}`,
      orderNumber,
      items: [...this.cartService.items()],
      pricing: { ...this.cartService.pricing() },
      paymentMethod: this.paymentMethod,
      amountTendered: this.amountTendered,
      changeDue: this.changeDue,
      customerName: this.customerName || 'Walk-in Guest',
      customerPhone: this.customerPhone,
      tableNumber: this.tableNumber,
      orderType: this.orderType,
      status: 'Completed',
      createdAt: new Date().toISOString(),
      notes: this.notes
    };

    this.posService.processOrder(order).subscribe({
      next: (savedOrder) => {
        this.cartService.clearCart();
        this.isProcessing = false;
        this.router.navigate(['/pos/order-review']);
      },
      error: () => {
        this.isProcessing = false;
        this.toaster.error('Failed to record sales event in backend.', 'Transaction Error');
      }
    });
  }
}
