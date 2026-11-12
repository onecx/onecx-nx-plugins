# Angular application guidance

Before changing Angular components, templates, state, forms, or services, read
[best-practices.md](./best-practices.md). This upstream snapshot is bundled locally;
no download or network permission is required.

The following compatibility rules take precedence over the upstream snapshot.

## Angular 21 compatibility

Generated apps target Angular 21; framework dependency ranges allow patch updates,
while only the builder is pinned. Some upstream recommendations require Angular 22:

- Set `changeDetection: ChangeDetectionStrategy.OnPush` on new components.
- Use Reactive Forms for new forms; Signal Forms are not stable in Angular 21.
- Use `@Injectable({ providedIn: 'root' })` for singleton services rather than `@Service`.

## OneCX integration and existing code

- Preserve the NgModule adapters required by OneCX remote registration and bootstrap, along with existing NgRx feature wiring. Do not remove or redesign these integration boundaries as part of routine component work.
- Use signals for local component state. Keep established NgRx feature state as the source of truth for shared or feature state.
- Follow established patterns in untouched code; modernize only code in scope rather than mass-rewriting templates, state, or module boundaries.

## Completion

Add or update focused tests for changed behavior. Run the relevant quality checks using scripts defined by this app's `package.json`; allow configured pre-commit hooks to run.
