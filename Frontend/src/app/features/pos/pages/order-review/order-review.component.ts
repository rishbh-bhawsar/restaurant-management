import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PosService } from '../../services/pos.service';
import { PosOrder } from '../../models/pos.model';
import { RestaurantContextService } from '../../../../core/services/restaurant-context.service';

@Component({
  selector: 'app-order-review',
  templateUrl: './order-review.component.html',
  styleUrls: ['./order-review.component.scss'],
  standalone: false
})
export class OrderReviewComponent implements OnInit {
  order: PosOrder | null = null;

  constructor(
    private posService: PosService,
    public contextService: RestaurantContextService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.order = this.posService.currentOrder();
    if (!this.order) {
      // Create fallback demo order if opened directly
      this.order = {
        id: 'ord_demo_101',
        orderNumber: 'ORD-98241',
        items: [],
        pricing: {
          subtotal: 38.50,
          discountRate: 0,
          discountAmount: 0,
          taxRate: 0.0825,
          taxAmount: 3.18,
          grandTotal: 41.68
        },
        paymentMethod: 'Card',
        customerName: 'Guest Customer',
        tableNumber: 'Table 4',
        orderType: 'Dine-In',
        status: 'Completed',
        createdAt: new Date().toISOString()
      };
    }
  }

  printReceipt(): void {
    window.print();
  }

  startNewSale(): void {
    this.router.navigate(['/pos/terminal']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
