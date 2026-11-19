import { Component } from '@angular/core';
import { ToasterService, ToastMessage } from '../../../core/services/toaster.service';

@Component({
  selector: 'app-toaster',
  templateUrl: './toaster.component.html',
  styleUrls: ['./toaster.component.scss'],
  standalone: false
})
export class ToasterComponent {
  constructor(public toasterService: ToasterService) {}

  getIcon(type: ToastMessage['type']): string {
    switch (type) {
      case 'success':
        return 'bi-check-circle-fill text-success';
      case 'error':
        return 'bi-exclamation-octagon-fill text-danger';
      case 'warning':
        return 'bi-exclamation-triangle-fill text-warning';
      case 'info':
      default:
        return 'bi-info-circle-fill text-primary';
    }
  }

  getBorderClass(type: ToastMessage['type']): string {
    switch (type) {
      case 'success':
        return 'border-start-success';
      case 'error':
        return 'border-start-danger';
      case 'warning':
        return 'border-start-warning';
      case 'info':
      default:
        return 'border-start-primary';
    }
  }
}
