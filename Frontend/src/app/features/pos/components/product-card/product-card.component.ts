import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PosProduct } from '../../models/pos.model';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
  standalone: false
})
export class ProductCardComponent {
  @Input() product!: PosProduct;
  @Output() quickAdd = new EventEmitter<PosProduct>();
  @Output() customize = new EventEmitter<PosProduct>();

  onQuickAdd(e: Event): void {
    e.stopPropagation();
    this.quickAdd.emit(this.product);
  }

  onCustomize(): void {
    this.customize.emit(this.product);
  }
}
