import { Component, Input } from '@angular/core';
import { LowStockItem } from '../../models/dashboard.model';

@Component({
  selector: 'app-low-stock-alert',
  templateUrl: './low-stock-alert.component.html',
  styleUrls: ['./low-stock-alert.component.scss'],
  standalone: false
})
export class LowStockAlertComponent {
  @Input() items: LowStockItem[] = [];
}
