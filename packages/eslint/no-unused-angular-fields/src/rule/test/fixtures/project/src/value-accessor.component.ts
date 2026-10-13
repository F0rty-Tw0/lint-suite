// Scenario: ControlValueAccessor and Validator methods are invoked by Angular forms, never by the component itself.
import { Component, forwardRef } from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import type {
  AbstractControl,
  ControlValueAccessor,
  ValidationErrors,
  Validator
} from '@angular/forms';

@Component({
  selector: 'app-value-accessor',
  template: '<input (input)="update($event)" />',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ValueAccessorComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ValueAccessorComponent),
      multi: true
    }
  ]
})
export class ValueAccessorComponent implements ControlValueAccessor, Validator {
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string): void {
    console.log(value);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    console.log(disabled);
  }

  validate(control: AbstractControl): ValidationErrors | null {
    return control.value ? null : { required: true };
  }

  protected update(event: Event): void {
    this.onChange((event.target as HTMLInputElement).value);
    this.onTouched();
  }
}
