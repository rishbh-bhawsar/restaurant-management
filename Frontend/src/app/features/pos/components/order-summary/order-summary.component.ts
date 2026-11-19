import { Component, EventEmitter, Input, Output } from '@angular/core';
import { OrderPricing } from '../../models/pos.model';

@Component({
  selector: 'app-order-summary',
  templateUrl: './order-summary.component.html',
  styleUrls: ['./order-summary.component.scss'],
  standalone: false
})
export class OrderSummaryComponent {
  @Input() pricing!: OrderPricing;
  @Input() itemCount: number = 0;
  @Output() applyDiscount = new EventEmitter<number>();
  @Output() checkout = new EventEmitter<void>();

  discounts = [
    { label: '0%', rate: 0 },
    { label: '5%', rate: 0.05 },
    { label: '10%', rate: 0.10 },
    { label: '15%', rate: 0.15 }
  ];

  onSelectDiscount(rate: number): void {
    this.applyDiscount.emit(rate);
  }
}
