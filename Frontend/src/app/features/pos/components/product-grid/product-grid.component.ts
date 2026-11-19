import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PosProduct } from '../../models/pos.model';

@Component({
  selector: 'app-product-grid',
  templateUrl: './product-grid.component.html',
  styleUrls: ['./product-grid.component.scss'],
  standalone: false
})
export class ProductGridComponent {
  @Input() products: PosProduct[] = [];
  @Input() loading: boolean = false;
  @Output() quickAdd = new EventEmitter<PosProduct>();
  @Output() customize = new EventEmitter<PosProduct>();
  @Output() resetSearch = new EventEmitter<void>();
}
