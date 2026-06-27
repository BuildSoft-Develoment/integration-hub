import { Component, forwardRef, input, model, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

export type DurationUnit = 'S' | 'M' | 'H' | 'D';

export function parseDuration(value: string): { amount: number; unit: DurationUnit } {
  const match = value?.match(/^(\d+)([SMHD])$/);
  if (match) {
    return { amount: parseInt(match[1], 10), unit: match[2] as DurationUnit };
  }
  return { amount: 0, unit: 'M' };
}

export function formatDuration(amount: number, unit: DurationUnit): string {
  return `${amount}${unit}`;
}

@Component({
  selector: 'ih-duration-input',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatInputModule],
  template: `
    <div class="ih-duration-input">
      <mat-form-field subscriptSizing="dynamic" class="ih-duration-input__amount">
        <input matInput type="number" min="1" [disabled]="disabled()" [ngModel]="amount()" (ngModelChange)="onAmountChange($event)" />
      </mat-form-field>
      <mat-form-field subscriptSizing="dynamic" class="ih-duration-input__unit">
        <mat-select [disabled]="disabled()" [ngModel]="unit()" (ngModelChange)="onUnitChange($event)">
          <mat-option value="S">sec</mat-option>
          <mat-option value="M">min</mat-option>
          <mat-option value="H">hr</mat-option>
          <mat-option value="D">day</mat-option>
        </mat-select>
      </mat-form-field>
    </div>
  `,
  styles: [`
    .ih-duration-input { display: flex; align-items: center; gap: 0.5rem; }
    .ih-duration-input__amount { width: 5rem; }
    .ih-duration-input__unit { width: 5.5rem; }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DurationInputComponent),
      multi: true,
    },
  ],
})
export class DurationInputComponent implements ControlValueAccessor {
  readonly disabled = input(false);

  readonly amount = signal(0);
  readonly unit = signal<DurationUnit>('M');

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    const { amount, unit } = parseDuration(value);
    this.amount.set(amount);
    this.unit.set(unit);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // handled via input()
  }

  onAmountChange(value: number): void {
    this.amount.set(value);
    this.emitChange();
  }

  onUnitChange(value: DurationUnit): void {
    this.unit.set(value);
    this.emitChange();
  }

  private emitChange(): void {
    this.onChange(formatDuration(this.amount(), this.unit()));
    this.onTouched();
  }
}
