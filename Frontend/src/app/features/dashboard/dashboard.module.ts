import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { DashboardRoutingModule } from './dashboard-routing.module';

import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page.component';
import { StatsOverviewComponent } from './components/stats-overview/stats-overview.component';
import { RecentOrdersComponent } from './components/recent-orders/recent-orders.component';
import { LowStockAlertComponent } from './components/low-stock-alert/low-stock-alert.component';

@NgModule({
  declarations: [
    DashboardPageComponent,
    StatsOverviewComponent,
    RecentOrdersComponent,
    LowStockAlertComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    DashboardRoutingModule
  ]
})
export class DashboardModule {}
