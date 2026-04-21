import { Directive, ElementRef, AfterViewInit, Input } from '@angular/core';

declare var bootstrap: any;

@Directive({
  selector: '[bsTooltip]',
  standalone: true
})
export class BsTooltipDirective implements AfterViewInit {
  @Input('bsTooltip') tooltipTitle: string = '';

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    if (this.tooltipTitle) {
      this.el.nativeElement.setAttribute('title', this.tooltipTitle);
      new bootstrap.Tooltip(this.el.nativeElement);
    }
  }
}
