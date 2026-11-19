import { Directive, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Directive({
  selector: '[appInfiniteScroll]',
  standalone: false
})
export class InfiniteScrollDirective {
  @Input() scrollThreshold: number = 100; // px from bottom
  @Input() scrollDisabled: boolean = false;
  @Output() scrolled = new EventEmitter<void>();

  constructor(private el: ElementRef) {}

  @HostListener('scroll')
  onScroll(): void {
    if (this.scrollDisabled) return;

    const element = this.el.nativeElement;
    const atBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + this.scrollThreshold;

    if (atBottom) {
      this.scrolled.emit();
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.scrollDisabled) return;

    const windowHeight = 'innerHeight' in window ? window.innerHeight : document.documentElement.offsetHeight;
    const body = document.body;
    const html = document.documentElement;
    const docHeight = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight
    );
    const windowBottom = windowHeight + window.pageYOffset;

    if (windowBottom >= docHeight - this.scrollThreshold) {
      this.scrolled.emit();
    }
  }
}
