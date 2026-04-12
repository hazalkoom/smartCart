import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-admin-form-drawer',
  standalone: false,
  templateUrl: './admin-form-drawer.component.html',
  styleUrl: './admin-form-drawer.component.css',
})
export class AdminFormDrawerComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() title = 'Form';
  @Output() close = new EventEmitter<void>();

  @ViewChild('panel') panelRef?: ElementRef<HTMLElement>;

  readonly titleId = 'admin-form-drawer-title';

  private previousBodyOverflow = '';
  private lastFocusedElement: HTMLElement | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen) {
        this.onOpen();
        return;
      }

      this.onClose();
    }
  }

  ngOnDestroy(): void {
    this.unlockBodyScroll();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    if (!this.isOpen) {
      return;
    }

    if (event instanceof KeyboardEvent) {
      event.preventDefault();
    }

    this.requestClose();
  }

  requestClose(): void {
    this.close.emit();
  }

  onBackdropClick(): void {
    this.requestClose();
  }

  onPanelKeydown(event: KeyboardEvent): void {
    if (!this.isOpen || event.key !== 'Tab') {
      return;
    }

    const panel = this.panelRef?.nativeElement;
    if (!panel) {
      return;
    }

    const focusableElements = this.getFocusableElements(panel);
    if (focusableElements.length === 0) {
      event.preventDefault();
      panel.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement as HTMLElement | null;

    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  private onOpen(): void {
    if (typeof document === 'undefined') {
      return;
    }

    this.lastFocusedElement = document.activeElement as HTMLElement | null;
    this.lockBodyScroll();

    setTimeout(() => {
      this.focusInitialElement();
    }, 0);
  }

  private onClose(): void {
    if (typeof document === 'undefined') {
      return;
    }

    this.unlockBodyScroll();

    if (!this.lastFocusedElement) {
      return;
    }

    setTimeout(() => {
      this.lastFocusedElement?.focus();
      this.lastFocusedElement = null;
    }, 0);
  }

  private focusInitialElement(): void {
    if (typeof document === 'undefined') {
      return;
    }

    const panel = this.panelRef?.nativeElement;
    if (!panel) {
      return;
    }

    const focusableElements = this.getFocusableElements(panel);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
      return;
    }

    panel.focus();
  }

  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    if (typeof window === 'undefined') {
      return [];
    }

    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter((element) => {
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }

  private lockBodyScroll(): void {
    if (typeof document === 'undefined') {
      return;
    }

    this.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  private unlockBodyScroll(): void {
    if (typeof document === 'undefined') {
      return;
    }

    document.body.style.overflow = this.previousBodyOverflow;
  }
}
