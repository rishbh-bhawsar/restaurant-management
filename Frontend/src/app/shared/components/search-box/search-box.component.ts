import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-search-box',
  templateUrl: './search-box.component.html',
  styleUrls: ['./search-box.component.scss'],
  standalone: false
})
export class SearchBoxComponent {
  @Input() placeholder: string = 'Search records...';
  @Input() searchTerm: string = '';
  @Output() search = new EventEmitter<string>();

  private debounceTimer?: any;

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm = value;
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.search.emit(value);
    }, 300);
  }

  clear(): void {
    this.searchTerm = '';
    this.search.emit('');
  }
}
