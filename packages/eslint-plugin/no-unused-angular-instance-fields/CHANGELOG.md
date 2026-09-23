## 1.1.0 (2026-09-23)

### 🚀 Features

- ⚠️  **eslint-plugin:** ✨ report unread inputs, outputs, and queries ([57ab38a](https://github.com/F0rty-Tw0/lint-suite/commit/57ab38a))
- **eslint-plugin:** ✨ add `allowRxjsInteropFields` option ([faa7d90](https://github.com/F0rty-Tw0/lint-suite/commit/faa7d90))
- **angular:** ✨ add support for `allowRxjsInteropFields` option ([9965713](https://github.com/F0rty-Tw0/lint-suite/commit/9965713))

### ⚠️  Breaking Changes

- **eslint-plugin:** ✨ report unread inputs, outputs, and queries  ([57ab38a](https://github.com/F0rty-Tw0/lint-suite/commit/57ab38a))
  unread inputs, outputs, and queries are now reported
  by default.
  Claude-Session: https://claude.ai/code/session_01GNCvxVFjNTyt6y9q281siN

### ❤️ Thank You

- Artiom Tofan

# Changelog

## [Unreleased]

- **Breaking:** unread inputs, outputs, and queries are now reported. Signal `input()`, `input.required()`, `model()`, `output()`, `viewChild()`, `viewChildren()`, `contentChild()`, `contentChildren()`, and `@Input()`, `@ViewChild()`, `@ViewChildren()`, `@ContentChild()`, `@ContentChildren()` fields, and `@Output()` fields initialized with `new EventEmitter()` count as unused when the class, its template, and its host metadata never read them; parent bindings do not count. `outputFromObservable()` fields, `@Output()` fields backed by other observables, decorated setters, and inputs of classes declaring `ngOnChanges` stay exempt.
- Added `allowRxjsInteropFields` option to allow unread fields holding `@angular/core/rxjs-interop` calls (`toSignal`, `toObservable`, `outputToObservable`, `rxResource`).

## [1.0.0]

- Extracted `no-unused-instance-fields` as an independently installable Angular ESLint plugin.
