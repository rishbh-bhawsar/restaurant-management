import { Component, Input } from '@angular/core';
import { DashboardStats } from '../../models/dashboard.model';

@Component({
  selector: 'app-stats-overview',
  templateUrl: './stats-overview.component.html',
  styleUrls: ['./stats-overview.component.scss'],
  standalone: false
})
export class StatsOverviewComponent {
  @Input() stats: DashboardStats = {
    todaySales: 0,
    totalOrders: 0,
    activeItems: 0,
    lowStockCount: 0,
    salesGrowth: '+0%',
    orderGrowth: '+0%'
  };
}
