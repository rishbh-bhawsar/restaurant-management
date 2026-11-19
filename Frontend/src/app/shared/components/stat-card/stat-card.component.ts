import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.scss'],
  standalone: false
})
export class StatCardComponent {
  @Input() label: string = '';
  @Input() value: string | number = '';
  @Input() subtext: string = '';
  @Input() icon: string = 'bi-bar-chart';
  @Input() iconBg: string = '#eef2ff';
  @Input() iconColor: string = '#4f46e5';
  @Input() trend: string = '';
  @Input() trendPositive: boolean = true;
}
