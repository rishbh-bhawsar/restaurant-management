import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ProductCategory } from '../../models/pos.model';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss'],
  standalone: false
})
export class CategoryListComponent {
  @Input() categories: ProductCategory[] = [];
  @Input() selectedCategoryId: string = 'all';
  @Output() categorySelected = new EventEmitter<string>();

  select(id: string): void {
    this.selectedCategoryId = id;
    this.categorySelected.emit(id);
  }
}
