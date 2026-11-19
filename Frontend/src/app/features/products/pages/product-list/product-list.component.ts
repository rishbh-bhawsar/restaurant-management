import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { CatalogItem } from '../../models/product.model';
import { TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { ToasterService } from '../../../../core/services/toaster.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  standalone: false
})
export class ProductListComponent implements OnInit {
  items: CatalogItem[] = [];
  filteredItems: CatalogItem[] = [];
  loading = false;
  hasMore = false;
  offset = 0;
  limit = 8;
  total = 0;

  activeType = 'all';
  searchQuery = '';

  selectedItem: CatalogItem | null = null;
  isDetailsModalOpen = false;

  columns: TableColumn[] = [
    { key: 'item_ref', label: 'SKU / Ref' },
    { key: 'name', label: 'Item Name' },
    { key: 'category', label: 'Category' },
    { key: 'type', label: 'Catalog Type', type: 'badge', badgeClass: (val) => this.getTypeBadgeClass(val) },
    { key: 'selling_price', label: 'Selling Price', type: 'currency' },
    { key: 'cost_price', label: 'Cost Price', type: 'currency' },
    { key: 'stock_quantity', label: 'In Stock' },
    { key: 'status', label: 'Status', type: 'badge', badgeClass: () => 'bg-success-subtle text-success' }
  ];

  constructor(
    private productService: ProductService,
    private toaster: ToasterService
  ) {}

  ngOnInit(): void {
    this.loadItems(true);
  }

  loadItems(reset: boolean = false): void {
    if (reset) {
      this.offset = 0;
      this.items = [];
    }

    this.loading = true;
    this.productService.getCatalogItems(this.offset, this.limit, this.activeType).subscribe({
      next: (res) => {
        this.items = reset ? res.items : [...this.items, ...res.items];
        this.total = res.total;
        this.hasMore = res.hasMore;
        this.offset += res.items.length;
        this.applySearch();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toaster.error('Failed to retrieve catalog items.', 'Catalog Error');
      }
    });
  }

  onScrollEnd(): void {
    if (!this.loading && this.hasMore) {
      this.loadItems(false);
    }
  }

  onTypeChange(type: string): void {
    this.activeType = type;
    this.loadItems(true);
  }

  onSearch(term: string): void {
    this.searchQuery = term.toLowerCase().trim();
    this.applySearch();
  }

  applySearch(): void {
    if (!this.searchQuery) {
      this.filteredItems = [...this.items];
      return;
    }
    this.filteredItems = this.items.filter(
      (item) =>
        item.name.toLowerCase().includes(this.searchQuery) ||
        item.item_ref.toLowerCase().includes(this.searchQuery) ||
        item.category.toLowerCase().includes(this.searchQuery)
    );
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'Product':
        return 'bg-primary-subtle text-primary';
      case 'Ingredient':
        return 'bg-info-subtle text-info';
      case 'Preparation':
        return 'bg-warning-subtle text-warning';
      default:
        return 'bg-secondary-subtle text-secondary';
    }
  }

  onRowClick(item: CatalogItem): void {
    this.selectedItem = item;
    this.isDetailsModalOpen = true;
  }

  closeDetailsModal(): void {
    this.isDetailsModalOpen = false;
    this.selectedItem = null;
  }
}
