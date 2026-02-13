import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      [class]="'btn btn--' + variant()"
      [disabled]="disabled()"
      (click)="handleClick()"
    >
      {{ label() }}
    </button>
  `,
  styles: [
    `
      .btn {
        padding: 8px 16px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        font-size: 14px;
      }

      .btn--primary {
        background: #1ea7fd;
        color: white;
      }

      .btn--secondary {
        background: transparent;
        border: 1px solid #333;
        color: #333;
      }
    `,
  ],
})
export class ButtonComponent {
  public readonly label = input<string>('Button');
  public readonly variant = input<'primary' | 'secondary'>('primary');
  public readonly disabled = input<boolean>(false);
  public readonly clicked = output<void>();

  public handleClick(): void {
    this.clicked.emit();
  }
}
