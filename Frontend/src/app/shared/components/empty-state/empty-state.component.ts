import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
  standalone: false
})
export class EmptyStateComponent {
  @Input() title: string = 'No Records Found';
  @Input() description: string = 'There are no items matching your criteria or database is empty.';
  @Input() icon: string = 'bi-search';
  @Input() actionText: string = 'Reset Filters';
  @Input() showAction: boolean = true;
  @Input() is404: boolean = false;

  @Output() action = new EventEmitter<void>();

  onActionClick(): void {
    this.action.emit();
  }
}
