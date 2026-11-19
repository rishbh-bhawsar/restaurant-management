import { Component, Input } from '@angular/core';
import { RecentOrder } from '../../models/dashboard.model';

@Component({
  selector: 'app-recent-orders',
  templateUrl: './recent-orders.component.html',
  styleUrls: ['./recent-orders.component.scss'],
  standalone: false
})
export class RecentOrdersComponent {
  @Input() orders: RecentOrder[] = [];
}
