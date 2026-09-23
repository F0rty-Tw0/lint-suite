# Changelog

## [Unreleased]

- **Breaking:** unread inputs, outputs, and queries are now reported. Signal `input()`, `input.required()`, `model()`, `output()`, `viewChild()`, `viewChildren()`, `contentChild()`, `contentChildren()`, and `@Input()`, `@ViewChild()`, `@ViewChildren()`, `@ContentChild()`, `@ContentChildren()` fields, and `@Output()` fields initialized with `new EventEmitter()` count as unused when the class, its template, and its host metadata never read them; parent bindings do not count. `outputFromObservable()` fields, `@Output()` fields backed by other observables, decorated setters, and inputs of classes declaring `ngOnChanges` stay exempt.
- Added `allowRxjsInteropFields` option to allow unread fields holding `@angular/core/rxjs-interop` calls (`toSignal`, `toObservable`, `outputToObservable`, `rxResource`).

## [1.0.0]

- Extracted `no-unused-instance-fields` as an independently installable Angular ESLint plugin.
