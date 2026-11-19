import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardStats, RecentOrder, LowStockItem } from '../../models/dashboard.model';
import { ToasterService } from '../../../../core/services/toaster.service';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss'],
  standalone: false
})
export class DashboardPageComponent implements OnInit {
  loading = true;
  stats: DashboardStats = {
    todaySales: 0,
    totalOrders: 0,
    activeItems: 0,
    lowStockCount: 0,
    salesGrowth: '',
    orderGrowth: ''
  };
  recentOrders: RecentOrder[] = [];
  lowStockItems: LowStockItem[] = [];

  constructor(
    private dashboardService: DashboardService,
    private router: Router,
    private toaster: ToasterService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.dashboardService.getDashboardData().subscribe({
      next: (data) => {
        this.stats = data.stats;
        this.recentOrders = data.recentOrders;
        this.lowStockItems = data.lowStockItems;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toaster.error('Failed to load dashboard metrics from backend.', 'Sync Error');
      }
    });
  }

  goToPos(): void {
    this.router.navigate(['/pos/terminal']);
  }
}
