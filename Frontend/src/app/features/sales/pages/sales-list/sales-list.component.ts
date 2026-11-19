import { Component, OnInit } from '@angular/core';
import { SalesService } from '../../services/sales.service';
import { SalesEvent } from '../../models/sales.model';
import { TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { ToasterService } from '../../../../core/services/toaster.service';

@Component({
  selector: 'app-sales-list',
  templateUrl: './sales-list.component.html',
  styleUrls: ['./sales-list.component.scss'],
  standalone: false
})
export class SalesListComponent implements OnInit {
  sales: SalesEvent[] = [];
  filteredSales: SalesEvent[] = [];
  loading = false;
  hasMore = false;
  offset = 0;
  limit = 8;
  total = 0;
  searchQuery = '';

  selectedSale: SalesEvent | null = null;
  isReceiptModalOpen = false;

  columns: TableColumn[] = [
    { key: 'order_number', label: 'Order #' },
    { key: 'customer_name', label: 'Customer / Guest' },
    { key: 'items_count', label: 'Items' },
    { key: 'payment_method', label: 'Payment Method', type: 'badge', badgeClass: (val) => this.getPaymentBadgeClass(val) },
    { key: 'subtotal', label: 'Subtotal', type: 'currency' },
    { key: 'tax_amount', label: 'Tax', type: 'currency' },
    { key: 'total_amount', label: 'Total Paid', type: 'currency' },
    { key: 'created_at', label: 'Timestamp', type: 'date' },
    { key: 'status', label: 'Status', type: 'badge', badgeClass: () => 'bg-success-subtle text-success' }
  ];

  constructor(
    private salesService: SalesService,
    private toaster: ToasterService
  ) {}

  ngOnInit(): void {
    this.loadSales(true);
  }

  loadSales(reset: boolean = false): void {
    if (reset) {
      this.offset = 0;
      this.sales = [];
    }

    this.loading = true;
    this.salesService.getSales(this.offset, this.limit).subscribe({
      next: (res) => {
        this.sales = reset ? res.items : [...this.sales, ...res.items];
        this.total = res.total;
        this.hasMore = res.hasMore;
        this.offset += res.items.length;
        this.applySearch();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toaster.error('Failed to load sales history from backend.', 'Sync Error');
      }
    });
  }

  onScrollEnd(): void {
    if (!this.loading && this.hasMore) {
      this.loadSales(false);
    }
  }

  onSearch(term: string): void {
    this.searchQuery = term.toLowerCase().trim();
    this.applySearch();
  }

  applySearch(): void {
    if (!this.searchQuery) {
      this.filteredSales = [...this.sales];
      return;
    }
    this.filteredSales = this.sales.filter(
      (s) =>
        s.order_number.toLowerCase().includes(this.searchQuery) ||
        (s.customer_name && s.customer_name.toLowerCase().includes(this.searchQuery)) ||
        s.payment_method.toLowerCase().includes(this.searchQuery)
    );
  }

  getPaymentBadgeClass(method: string): string {
    switch (method) {
      case 'Card':
        return 'bg-primary-subtle text-primary';
      case 'Cash':
        return 'bg-success-subtle text-success';
      case 'UPI':
        return 'bg-info-subtle text-info';
      default:
        return 'bg-warning-subtle text-warning';
    }
  }

  onRowClick(sale: SalesEvent): void {
    this.selectedSale = sale;
    this.isReceiptModalOpen = true;
  }

  closeModal(): void {
    this.isReceiptModalOpen = false;
    this.selectedSale = null;
  }
}
