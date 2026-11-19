import { Component, OnInit } from '@angular/core';
import { InventoryService } from '../../services/inventory.service';
import { StockItem } from '../../models/inventory.model';
import { TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { ToasterService } from '../../../../core/services/toaster.service';

@Component({
  selector: 'app-inventory-list',
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.scss'],
  standalone: false
})
export class InventoryListComponent implements OnInit {
  items: StockItem[] = [];
  filteredItems: StockItem[] = [];
  loading = false;
  hasMore = false;
  offset = 0;
  limit = 8;
  total = 0;
  searchQuery = '';

  filterStatus = 'all';

  columns: TableColumn[] = [
    { key: 'item_ref', label: 'Item Ref' },
    { key: 'item_name', label: 'Stock Description' },
    { key: 'category', label: 'Category' },
    { key: 'quantity_on_hand', label: 'On Hand Qty' },
    { key: 'reorder_level', label: 'Reorder Level' },
    { key: 'unit_cost', label: 'Unit Cost', type: 'currency' },
    { key: 'total_value', label: 'Stock Value', type: 'currency' },
    { key: 'status', label: 'Stock Health', type: 'badge', badgeClass: (val) => this.getStatusBadgeClass(val) }
  ];

  constructor(
    private inventoryService: InventoryService,
    private toaster: ToasterService
  ) {}

  ngOnInit(): void {
    this.loadInventory(true);
  }

  loadInventory(reset: boolean = false): void {
    if (reset) {
      this.offset = 0;
      this.items = [];
    }

    this.loading = true;
    this.inventoryService.getStockLevels(this.offset, this.limit).subscribe({
      next: (res) => {
        this.items = reset ? res.items : [...this.items, ...res.items];
        this.total = res.total;
        this.hasMore = res.hasMore;
        this.offset += res.items.length;
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toaster.error('Failed to load stock levels from backend.', 'Inventory Error');
      }
    });
  }

  onScrollEnd(): void {
    if (!this.loading && this.hasMore) {
      this.loadInventory(false);
    }
  }

  onSearch(term: string): void {
    this.searchQuery = term.toLowerCase().trim();
    this.applyFilter();
  }

  setStatusFilter(status: string): void {
    this.filterStatus = status;
    this.applyFilter();
  }

  applyFilter(): void {
    this.filteredItems = this.items.filter((item) => {
      const matchStatus = this.filterStatus === 'all' || item.status.toLowerCase() === this.filterStatus.toLowerCase();
      const matchSearch =
        !this.searchQuery ||
        item.item_name.toLowerCase().includes(this.searchQuery) ||
        item.item_ref.toLowerCase().includes(this.searchQuery) ||
        item.category.toLowerCase().includes(this.searchQuery);

      return matchStatus && matchSearch;
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'In Stock':
        return 'bg-success-subtle text-success';
      case 'Low Stock':
        return 'bg-danger-subtle text-danger fw-bold';
      case 'Out of Stock':
        return 'bg-dark text-white fw-bold';
      default:
        return 'bg-secondary-subtle text-secondary';
    }
  }
}
