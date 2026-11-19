import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'badge' | 'currency' | 'date' | 'custom';
  badgeClass?: (val: any) => string;
}

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  standalone: false
})
export class DataTableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() loading: boolean = false;
  @Input() totalRecords: number = 0;
  @Input() emptyTitle: string = 'No Records Found';
  @Input() emptyDescription: string = 'No data matching current criteria.';
  @Input() hasMore: boolean = false;

  @Output() scrollEnd = new EventEmitter<void>();
  @Output() rowClick = new EventEmitter<any>();
  @Output() refresh = new EventEmitter<void>();

  onScroll(): void {
    if (!this.loading && this.hasMore) {
      this.scrollEnd.emit();
    }
  }

  onRowClick(row: any): void {
    this.rowClick.emit(row);
  }
}
