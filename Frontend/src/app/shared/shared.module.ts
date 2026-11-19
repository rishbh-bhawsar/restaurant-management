import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material modules
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';

// Shared Components
import { DataTableComponent } from './components/data-table/data-table.component';
import { PageHeaderComponent } from './components/page-header/page-header.component';
import { StatCardComponent } from './components/stat-card/stat-card.component';
import { SearchBoxComponent } from './components/search-box/search-box.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { ToasterComponent } from './components/toaster/toaster.component';

// Directives & Pipes
import { InfiniteScrollDirective } from './directives/infinite-scroll.directive';
import { CurrencyFormatPipe, TruncatePipe } from './pipes/shared-pipes';

const SHARED_COMPONENTS = [
  DataTableComponent,
  PageHeaderComponent,
  StatCardComponent,
  SearchBoxComponent,
  ConfirmDialogComponent,
  EmptyStateComponent,
  ToasterComponent
];

const SHARED_DIRECTIVES_PIPES = [
  InfiniteScrollDirective,
  CurrencyFormatPipe,
  TruncatePipe
];

const MATERIAL_MODULES = [
  MatButtonModule,
  MatIconModule,
  MatCardModule,
  MatInputModule,
  MatFormFieldModule,
  MatBadgeModule,
  MatTooltipModule,
  MatProgressBarModule,
  MatDialogModule,
  MatTabsModule
];

@NgModule({
  declarations: [
    ...SHARED_COMPONENTS,
    ...SHARED_DIRECTIVES_PIPES
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ...MATERIAL_MODULES
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ...MATERIAL_MODULES,
    ...SHARED_COMPONENTS,
    ...SHARED_DIRECTIVES_PIPES
  ]
})
export class SharedModule {}
