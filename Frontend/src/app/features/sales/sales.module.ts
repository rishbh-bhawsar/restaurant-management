import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { SalesRoutingModule } from './sales-routing.module';
import { SalesListComponent } from './pages/sales-list/sales-list.component';

@NgModule({
  declarations: [SalesListComponent],
  imports: [
    CommonModule,
    SharedModule,
    SalesRoutingModule
  ]
})
export class SalesModule {}
