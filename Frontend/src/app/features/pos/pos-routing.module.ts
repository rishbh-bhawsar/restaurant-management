import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PosTerminalComponent } from './pages/pos-terminal/pos-terminal.component';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { OrderReviewComponent } from './pages/order-review/order-review.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'terminal',
    pathMatch: 'full'
  },
  {
    path: 'terminal',
    component: PosTerminalComponent,
    data: { breadcrumb: 'POS Terminal' }
  },
  {
    path: 'checkout',
    component: CheckoutComponent,
    data: { breadcrumb: 'Checkout' }
  },
  {
    path: 'order-review',
    component: OrderReviewComponent,
    data: { breadcrumb: 'Order Review' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PosRoutingModule {}
