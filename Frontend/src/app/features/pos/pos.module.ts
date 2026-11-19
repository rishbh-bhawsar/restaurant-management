import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { PosRoutingModule } from './pos-routing.module';

// Pages
import { PosTerminalComponent } from './pages/pos-terminal/pos-terminal.component';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { OrderReviewComponent } from './pages/order-review/order-review.component';

// Components
import { CategoryListComponent } from './components/category-list/category-list.component';
import { ProductGridComponent } from './components/product-grid/product-grid.component';
import { ProductCardComponent } from './components/product-card/product-card.component';
import { ProductCustomizationComponent } from './components/product-customization/product-customization.component';
import { CartPanelComponent } from './components/cart-panel/cart-panel.component';
import { OrderSummaryComponent } from './components/order-summary/order-summary.component';

@NgModule({
  declarations: [
    PosTerminalComponent,
    CheckoutComponent,
    OrderReviewComponent,
    CategoryListComponent,
    ProductGridComponent,
    ProductCardComponent,
    ProductCustomizationComponent,
    CartPanelComponent,
    OrderSummaryComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    PosRoutingModule
  ]
})
export class PosModule {}
