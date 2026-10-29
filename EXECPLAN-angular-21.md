# ExecPlan: Upgrade Pokemon app from Angular 13 to Angular 21 (standalone, signals, rxResource, control flow)

This is a living document. Update **Progress**, **Surprises & Discoveries** and **Decision Log** as work proceeds. Anyone with only this file and the repo should be able to carry the work out.

## Purpose

The app (`C:\Users\andre\Desktop\PokemonAngular`) is on Angular 13.3 with NgModules, `*ngIf`/`*ngFor`, and observables held in `items$` fields that get reassigned and read with `| async`. After this work it will be on Angular 21 and will:

1. have **no NgModules**: standalone components, `bootstrapApplication`, `app.config.ts`, `app.routes.ts`;
2. load data with **`rxResource`** wherever a component fetches via an Observable;
3. use **built-in control flow** (`@if`, `@for`, `@else`) instead of `*ngIf`/`*ngFor`/`<ng-template #x>`;
4. behave exactly as before for the user (parity), with passing build and tests.

How to see it working: `npm start`, then walk the three routes (see **Validation**).

## Progress

- [x] M0 Baseline and safety net
- [x] M1 Tooling: Node/nvm, version hops 13 -> 21 with `ng update`
- [x] M2 Build config modernisation (application builder, tsconfig, polyfills, environments)
- [x] M3 Remove NgModules (standalone conversion, `main.ts`, `app.config.ts`, `app.routes.ts`)
- [x] M4 Replace third-party module libs (`ngx-disable-during-ajax`, `ng-http-caching`)
- [x] M5 Control flow migration
- [x] M6 `rxResource` refactor: water, fire, search
- [x] M7 Modernise service and DI (`inject()`, `providedIn: 'root'`)
- [x] M8 Tests updated and green
- [x] M9 Final validation, README refresh, cleanup

## Surprises & Discoveries

- **No nvm**: per-hop Node was supplied with `npx -p node@N -p @angular/cli@N -- ng update ...` instead. Hops used Node 16 (14, 15), 18 (16, 17), 20 (18-20) and 24 (21).
- **Later removal**: `deelay.me` (unreachable) and `ng-http-caching` were removed entirely (no 10s Water cache, no interceptor providers); Karma/Jasmine were bumped to versions compatible with `@angular/build` 21.
- **Peer-dependency chain at hop 15**: `ng-http-caching@13` pinned Angular ^13, and `ngx-disable-during-ajax@0.0.4` was NgModule-only and last published in 2022. Removed the latter at hop 15 (button now uses `[disabled]="items.isLoading()"`) and moved `ng-http-caching` to the matching major each hop (15 -> 16 -> 21.0.10). Version 21 of the library exists, so no replacement interceptor was needed (D7 not triggered).
- **Control flow was applied automatically** by the `ng update` hop to 21, so M5 needed no separate schematic run.
- **`resource.value()` throws in the error state** in Angular 21. Found by hitting `deelay.me` (unreachable from the test browser) on the Fire route: the template threw on every change detection. Fixed by reading values through `hasValue()`-guarded `computed` signals; regression test added in `fire.component.spec.ts`.
- **Karma builder ignores `stylePreprocessorOptions.includePaths`** set by the application-builder migration, so `search.component.scss` now uses `@use '../../variables'` and the option was removed.
- `src/environments` and `enableProdMode` were removed (no longer needed); `pace.css` emits a harmless "3 rules skipped" warning from vendor-prefixed keyframes.
- `useDefineForClassFields: false` set by the CLI migration was removed once all classes used `inject()`.
- The `fire` route depends on `deelay.me`, which was unreachable in the validation browser, so the Fire list rendering was verified by unit tests only.

## Decision Log

| # | Decision | Why |
|---|----------|-----|
| D1 | Upgrade **one major at a time** (13->14->...->21) with `ng update`. Angular does not support skipping majors. | Official path; each hop runs migrations that rewrite code. |
| D2 | Fallback if the hops get painful (esp. 13 -> 15 on old webpack/Node): scaffold a fresh Angular 21 app with `ng new` and port the 3 components, service and interfaces into it. | The app is ~10 source files; a port is cheap. Decide at the end of M1 if blocked >1 day. |
| D3 | Keep **zone.js** and Karma/Jasmine for this upgrade. Zoneless and Vitest are separate follow-ups. | Keeps the change reviewable. Signals + `rxResource` are zoneless-ready, so follow-ups are easy. |
| D4 | Keep file names as they are (`search.component.ts`, etc.) and keep the `search/`, `fire/`, `water/` folders. | Folders were just created; the v20+ naming style guide is optional. |
| D5 | Keep Reactive Forms (`FormGroup`) in Search. Signal Forms are experimental in v21. | Stability. |
| D6 | Behaviour parity: no new loading/error UI unless listed in M6. | Avoid scope creep. |

## Context (current state, verified by reading the repo)

- `package.json`: Angular `~13.3.0`, CLI `~13.3.5`, TypeScript `~4.6`, RxJS `~7.5`, zone.js `~0.11`, Karma/Jasmine. Third-party: `ng-http-caching ^13.0.10`, `ngx-disable-during-ajax ^0.0.4`.
- `angular.json`: legacy `@angular-devkit/build-angular:browser` builder; `main`, `polyfills: src/polyfills.ts`, `src/test.ts`, `browserTarget`, `fileReplacements` for `src/environments/environment*.ts`; global `externalJSLibraries/pace/pace.{css,min.js}` (scripts + styles).
- `src/main.ts`: `platformBrowserDynamic().bootstrapModule(AppModule)` with `enableProdMode`.
- `src/app/app.module.ts`: declares `AppComponent`, `SearchComponent`, `FireComponent`, `WaterComponent`; imports `BrowserModule`, `AppRoutingModule`, `HttpClientModule`, `FormsModule`, `ReactiveFormsModule`, `NgHttpCachingModule`, `DisableDuringAjaxModule`; provides `HttpService`.
- `src/app/app-routing.module.ts`: routes `''` and `search` -> Search, `fire` -> Fire, `water` -> Water.
- `src/app/app.component.*`: logo, nav with `routerLink`/`routerLinkActive`, `<router-outlet>`. Empty `ngOnInit`.
- `src/app/services/http.service.ts`: `@Injectable()` (provided in the module), constructor-injected `HttpClient`, methods `getTypes`, `getAbilities`, `getWaterPokemon` (sends `NgHttpCachingHeaders.LIFETIME` = 10s), `getFirePokemon` (via `deelay.me/1000/` to simulate latency), `getPokemonList(url)`, `getPokemonDetail(url)`, `errorHandler`.
- `src/app/interfaces/`: `Item`, `Detail`, `Filter`. Keep unchanged.
- Components today:
  - **Water**: `waterPokemon$ = service.getWaterPokemon()`; template `<li *ngFor ... | async [value]="pokemon">` (the `[value]` on `li` is meaningless).
  - **Fire**: `items$` starts as `of([])`; button `(click)="getFirePokemon()"` with `ngx-disable-during-ajax` reassigns `items$`; template shows list if `(items$|async)?.length !== 0`, else "Press the button above."
  - **Search**: `FormGroup` with `types`/`abilities` selects; selecting one clears the other, sets `currentSearchUrl`, assigns `items$ = service.getPokemonList(url)`; clicking a row assigns `specificPokemonDetail$ = service.getPokemonDetail(url).pipe(tap(scrollPage))`; template uses `*ngIf ... as detail`, three `*ngFor`s, `| async` x5, `titlecase`.
- Specs: `*.component.spec.ts` x4 use `declarations: [...]`, `HttpClientTestingModule`, and (search) the removed `async` helper and direct `component.items$ = of(...)`.

## Plan of Work

### M0 Baseline and safety net

The folder is **not a git repo**. Before touching anything:
1. `git init`, add a `.gitignore` check (node_modules, dist, .angular are already ignored), commit "baseline Angular 13". If you would rather not use git, copy the whole folder to `PokemonAngular-backup`.
2. Record baseline behaviour: run `npm start` (needs a Node that can run Angular 13, see M1) or just note the expected behaviours in **Validation**, which are derived from the current code.
3. Create commits/checkpoints after every milestone below.

### M1 Tooling and version hops

Angular 21 needs Node `^20.19`, `^22.12` or `^24` and TypeScript `>=5.9 <6.1`. The installed Node is 24.19, which is too new for Angular 13-16 tooling (webpack 5 + OpenSSL 3 errors such as `ERR_OSSL_EVP_UNSUPPORTED`). Use **nvm-windows** to match Node to each hop (verify each row against https://angular.dev/reference/versions before running):

| Hop | Node to use |
|-----|-------------|
| 13 -> 14 | 16.20 |
| 14 -> 15 | 16.20 or 18.20 |
| 15 -> 16 | 18.20 |
| 16 -> 17 | 18.20 |
| 17 -> 18 | 18.20 or 20.19 |
| 18 -> 19 | 20.19 |
| 19 -> 20 | 20.19 |
| 20 -> 21 | 20.19, 22.12+ or 24 |

For each hop N (14..21), from the repo root:

```
git status                      # must be clean (commit first)
npx @angular/cli@N update @angular/core@N @angular/cli@N
npm install
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
git add -A && git commit -m "ng update to N"
```

Notes per hop:
- **14**: typed forms migration will turn `FormGroup` into `UntypedFormGroup`/`FormGroup<any>` in `search.component.ts`; accept it, we retype in M6.
- **15**: TypeScript 4.8/4.9; `tsconfig` lib/target bumps. Expect `async` from `@angular/core/testing` to be flagged; we delete it in M8.
- **16**: TypeScript 5; `entryComponents` etc. irrelevant. Ensure `zone.js` moves to `~0.13`.
- **17**: the CLI offers the **application builder** migration and control-flow/standalone schematics. Say **no** for now to the builder prompt if offered mid-hop; we do it deliberately in M2.
- **18/19**: `HttpClientModule` is deprecated in favour of `provideHttpClient()`; v19 adds `standalone: false` to every declared component (we remove it in M3). `ng-http-caching` and `ngx-disable-during-ajax` must be checked at **each** hop (see M4); if `npm install` reports a peer-dependency conflict, resolve it in that hop and log it under **Surprises**.
- **20**: `browserTarget` -> `buildTarget`, `resource` APIs renamed `request/loader` -> `params/stream`. Use the new names only.
- **21**: confirm TypeScript is 5.9.x and RxJS is >=7.4.

Third-party libraries: at hop 14 run `npm view ng-http-caching versions` and `npm view ngx-disable-during-ajax versions` and note the newest release that supports Angular N. `ngx-disable-during-ajax@0.0.4` is very old and almost certainly has no support beyond ~Angular 13; it is replaced in M4, so remove it from `package.json` **at hop 14** and stub the usage (temporarily restore a plain button) rather than carrying a broken dependency.

Exit criteria: `package.json` shows Angular `^21`, `npm run build` and `npm test` pass (still module-based code), commit.

### M2 Build configuration modernisation

1. Run `ng update @angular/cli --name use-application-builder` (or hand-edit) to move `build` to `@angular/build:application`:
   - `main` -> `browser: "src/main.ts"`;
   - `polyfills: "src/polyfills.ts"` -> `polyfills: ["zone.js"]`; then delete `src/polyfills.ts` and drop it from `tsconfig.app.json` / `tsconfig.spec.json` `files`;
   - `buildTarget`, `serve` -> `@angular/build:dev-server`;
   - the `scripts` array (`pace.min.js`) is still supported by the application builder; keep it. `styles` keep as is.
2. `tsconfig.json`: `target`/`module` `ES2022`, `moduleResolution: "bundler"`, drop `downlevelIteration` unless needed, drop `baseUrl` unless needed, keep `strict` flags. Note `useDefineForClassFields` becomes effective with ES2022: any class field initialiser that reads a constructor parameter property (e.g. `myForm = this.fb.group({})`, `waterPokemon$ = this.httpService...`) breaks. These are removed anyway by the `inject()` conversion in M6/M7, but if the build is run between milestones, set `"useDefineForClassFields": false` temporarily.
3. Test builder: keep `@angular/build:karma` (D3). Remove `src/test.ts` if the new builder no longer needs it; `tsconfig.spec.json` `files` -> `include` only.
4. Keep `src/environments` and `fileReplacements`, but check `main.ts` no longer needs `enableProdMode` (it is not needed with the application builder; remove it in M3 together with the `environment` import if nothing else uses it).

Exit: `ng build` and `ng serve` work, Pace loader still appears.

### M3 Remove NgModules

Use the schematics, then review by hand. Run in this order, committing after each:

```
ng generate @angular/core:standalone     # 1. "Convert all components, directives and pipes to standalone"
ng generate @angular/core:standalone     # 2. "Remove unnecessary NgModule classes"
ng generate @angular/core:standalone     # 3. "Bootstrap the application using standalone APIs"
```

If a schematic is unavailable in v21, do it manually as below. Target end state:

`src/main.ts`
```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err));
```

`src/app/app.config.ts`
```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideNgHttpCaching } from 'ng-http-caching';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideNgHttpCaching(),
  ],
};
```
(`withInterceptorsFromDi()` only if the version of `ng-http-caching` still registers a class-based interceptor; see M4.)

`src/app/app.routes.ts` (replaces `app-routing.module.ts`; lazy-load the three routes):
```ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', loadComponent: () => import('./search/search.component').then(m => m.SearchComponent) },
  { path: 'search', loadComponent: () => import('./search/search.component').then(m => m.SearchComponent) },
  { path: 'fire', loadComponent: () => import('./fire/fire.component').then(m => m.FireComponent) },
  { path: 'water', loadComponent: () => import('./water/water.component').then(m => m.WaterComponent) },
];
```

Component changes:
- Delete `app.module.ts` and `app-routing.module.ts`.
- Remove `standalone: false` from every `@Component` (standalone is the default in v19+).
- `AppComponent`: `imports: [RouterOutlet, RouterLink, RouterLinkActive]`; delete the empty constructor and `OnInit`.
- `SearchComponent`: `imports: [ReactiveFormsModule, TitleCasePipe]`.
- `FireComponent`, `WaterComponent`: `imports: [TitleCasePipe]`.
- `HttpService`: `@Injectable({ providedIn: 'root' })` (no longer provided in a module).
- Grep to confirm nothing is left: `Grep "NgModule|\\.module'|standalone: false"` in `src/` returns nothing.

Exit: build passes with zero NgModules.

### M4 Third-party libraries

- **`ngx-disable-during-ajax`**: remove from `package.json`, `app.config`, and `fire.component.html` (`ngx-disable-during-ajax` attribute). Its behaviour (disable the button while the request is in flight) is replaced by `[disabled]="items.isLoading()"` using the resource in M6. No replacement package.
- **`ng-http-caching`**: used for the 10s cache in `getWaterPokemon`. Install the latest version that declares an Angular 21 peer range. If one exists, use `provideNgHttpCaching()` (standalone provider) and keep the `NgHttpCachingHeaders.LIFETIME` header in the service. If none exists, replace with a small functional interceptor (`withInterceptors([cacheInterceptor])`) that caches GETs carrying a lifetime header in a `Map<string, {expires, response}>`, or drop the cache and log decision **D7**. Either way the water route must still avoid a second network call within 10s (check in the Network tab).

### M5 Control flow migration

Run `ng generate @angular/core:control-flow` and review the diff, then ensure the result matches the following (the schematic leaves `track $index`, which should be improved):

`water.component.html` (after M6 the data read changes; shown here with the final form)
```html
<p>Here are all the water pokemon:</p>
<ul>
  @for (pokemon of waterPokemon.value(); track pokemon.name) {
    <li>{{ pokemon.name | titlecase }}</li>
  }
</ul>
```

`fire.component.html`
```html
<p>Press the button below to start an async call. You'll see it becoming disabled during async call data transfer:</p>
<button type="button" [disabled]="items.isLoading()" (click)="load()">Get all Fire Pokemon</button>

@if (items.value().length) {
  <p>Here are all the fire pokemon:</p>
  <ul>
    @for (item of items.value(); track item.name) {
      <li>{{ item.name | titlecase }}</li>
    }
  </ul>
} @else {
  <div style="margin-top: 20px;">Press the button above.</div>
}
```
(The original `*ngIf="(items$|async)?.length !== 0; else loading"` shows the list when length is not 0; with `of([])` initial that is the same as `length > 0`.)

`search.component.html`: detail block -> `@if (detail.value(); as detail)`; abilities/moves `*ngFor` -> `@for (... ; track ability.ability.name)`; both `<option *ngFor>` -> `@for (... ; track t.url)`; table `*ngIf ... else loading` -> `@if (items.value().length) { <table>...</table> } @else { <div class="useSearch">...</div> }`; rows `@for (item of items.value(); track item.pokemon.url)`. Template-wide: remove every `| async`, drop needless `?.` where types are now non-optional.

`app.component.html` has no structural directives; no change except the router directives now being imported in the component.

Exit: `Grep "\\*ng(If|For|Switch)|ng-template|\\| async"` in `src/app/**/*.html` returns nothing.

### M6 rxResource refactor

`rxResource` lives in `@angular/core/rxjs-interop`. Signature in v20+: `rxResource({ params?, stream, defaultValue? })`; `stream` receives `{ params, abortSignal }`, returns an Observable; when `params()` returns `undefined` the resource stays `idle` and `stream` is not called; `.value()`, `.isLoading()`, `.error()`, `.status()`, `.reload()` are signals/methods. Provide `defaultValue: []` so `value()` is never `undefined` for lists.

**Water** (`water.component.ts`) - fetch on creation, no inputs:
```ts
@Component({ selector: 'app-water', imports: [TitleCasePipe], templateUrl: ..., styleUrls: [...] })
export class WaterComponent {
  private readonly http = inject(HttpService);
  readonly waterPokemon = rxResource({
    stream: () => this.http.getWaterPokemon(),
    defaultValue: [] as Filter[],
  });
}
```
Remove the empty `ngOnInit`/constructor.

**Fire** - fetch only after a click; button re-clicks reload:
```ts
export class FireComponent {
  private readonly http = inject(HttpService);
  private readonly started = signal(false);

  readonly items = rxResource({
    params: () => this.started() || undefined,   // undefined => idle, no request
    stream: () => this.http.getFirePokemon(),
    defaultValue: [] as Filter[],
  });

  load() {
    if (this.started()) this.items.reload();
    else this.started.set(true);
  }
}
```
Type `items` with `Filter[]` instead of `any[]`.

**Search** - four independent resources driven by signals:
```ts
export class SearchComponent {
  private readonly http = inject(HttpService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({ types: this.fb.control<string | null>(null),
                                  abilities: this.fb.control<string | null>(null) });

  private readonly searchUrl = signal<string | null>(null);
  private readonly detailUrl = signal<string | null>(null);

  readonly types = rxResource({ stream: () => this.http.getTypes(), defaultValue: [] as Filter[] });
  readonly abilities = rxResource({ stream: () => this.http.getAbilities(), defaultValue: [] as Filter[] });

  readonly items = rxResource({
    params: () => this.searchUrl() ?? undefined,
    stream: ({ params }) => this.http.getPokemonList(params),
    defaultValue: [] as Item[],
  });

  readonly detail = rxResource({
    params: () => this.detailUrl() ?? undefined,
    stream: ({ params }) => this.http.getPokemonDetail(params),
  });

  constructor() {
    effect(() => { if (this.detail.hasValue()) window.scroll({ top: 0, left: 0, behavior: 'smooth' }); });
  }

  setSearchUrl(changed: 'types' | 'abilities') {
    const other = changed === 'types' ? 'abilities' : 'types';
    this.searchUrl.set(this.form.controls[changed].value);
    this.form.controls[other].setValue(null);
  }

  viewPokemon(url: string) { this.detailUrl.set(url); }
}
```
Rules and gotchas:
- `ngOnInit`, `createForm`, `populateFilterLists`, `getData`, `scrollPage`, the commented-out block and the `of() as Observable<...>` hacks are deleted. The resources load the filter lists automatically at creation, replacing `populateFilterLists`.
- Keep the template's `(change)="setSearchUrl('types')"` handlers (D5). The `<option [value]="null">Please select</option>` renders the string "null"; selecting it sets `searchUrl` to `"null"` as before. Treat that value as "no search": in `setSearchUrl` map `"null"`/empty to `null` so we don't request `.../null` (this is a small bug fix; note it in **Surprises** if you want to keep strict parity).
- Re-clicking the same Pokemon: `detailUrl.set(sameUrl)` doesn't re-trigger, which is fine; scroll will not repeat. If the old behaviour (scroll again on each click) is wanted, call `window.scroll` inside `viewPokemon` instead of the effect.
- Errors: `HttpService.errorHandler` still throws a string; `rxResource` captures it into `.error()`. Nothing displays it (D6). Optionally add `@if (items.error()) {...}` later.
- Typing: `getPokemonDetail` should return `Observable<Detail>`; `getTypes`/`getAbilities` return `Observable<Filter[]>` already but type the `http.get<>` calls with the real response shape `{ results: Filter[] }` so the `map((res: any) => ...)` casts can go.

### M7 Service and DI modernisation

- `HttpService`: `private readonly http = inject(HttpClient)`; drop the constructor; unused imports (`share`, `timer`, `ReplaySubject`, `pipe`, `shareReplay`, `BehaviorSubject`, `of`, `HttpHeaders`, `tap`) removed; strip the BOM at the top of the file. Replace the deprecated string `throwError(error.message ...)` pattern with `throwError(() => new Error(error.message || 'server error.'))` (the value passed to a resource's `.error()` is then an `Error`).
- Run `ng generate @angular/core:inject` over any remaining constructor-injected classes.
- Optional: `ng generate @angular/core:route-lazy-loading` if lazy routes weren't hand-written.

### M8 Tests

Replace `declarations` with `imports`, `HttpClientTestingModule` with `provideHttpClient()` + `provideHttpClientTesting()`, and drop `HttpService` from `providers` (it is `providedIn: 'root'`).

- **water / fire specs**: `TestBed.configureTestingModule({ imports: [WaterComponent], providers: [provideHttpClient(), provideHttpClientTesting()] })`; use `HttpTestingController` to flush `.../type/11` and assert the `<li>` list renders (`await fixture.whenStable()` after `flush`). Fire: assert no request before click, one request after click, button disabled while pending.
- **search spec**: remove the `async` import and all references to `component.items$`, `ngOnInit()` and the "method exists" tests (they test members that no longer exist). New tests: (1) two requests fire on creation (types, abilities) and both selects render options; (2) choosing a type sets the other select to `null` and requests the chosen URL; (3) rendered rows appear and clicking "View Pokemon Character" requests the detail URL and renders name/abilities/moves; (4) before any selection the "Please use the search..." message is visible.
- **app.component.spec.ts**: `imports: [AppComponent]`, `provideRouter([])`; assert the three nav links.
- Remove `fakeAsync`/`tick` where `HttpTestingController` + `whenStable` suffice.

Run: `npm test -- --watch=false --browsers=ChromeHeadless`.

### M9 Final validation and cleanup

- Update `README.md` (CLI version string, commands).
- Remove dead files: `src/polyfills.ts`, `src/test.ts` (if unused), `app-routing.module.ts`, `app.module.ts`.
- `npx ng build` in production configuration; check bundle budgets (`angular.json` `initial` 500kb warn / 1mb error; `anyComponentStyle` 2kb warn / 4kb error). `search.component.scss` imports `src/variables`; confirm `@use` still resolves after the builder change (if not, use `@use 'variables'` with `stylePreprocessorOptions.includePaths: ["src"]`).

## Validation (acceptance, run by a human or an automated browser)

1. `npm run build` completes with no errors/warnings about deprecated APIs.
2. `npm test -- --watch=false --browsers=ChromeHeadless` all green.
3. `Grep` checks (all must return nothing in `src/`): `NgModule`, `bootstrapModule`, `\*ngIf`, `\*ngFor`, `ng-template`, `\| async`, `standalone: false`, `HttpClientModule`, `ngx-disable-during-ajax`.
4. `npm start`, open `http://localhost:4200/`:
   - `/` and `/search`: form with "By Types"/"By Abilities" dropdowns filled from PokeAPI, message "Please use the search to filter various Pokemon." and no table.
   - Pick a Type: table of Pokemon appears and the Ability select resets to "Please select". Pick an Ability: the Type select resets. Click "View Pokemon Character": page scrolls to top and a panel shows sprite, name, abilities and moves.
   - `/fire`: no request on load (DevTools Network). Click button: it is disabled for about 1 second (deelay.me), then the list renders; message "Press the button above." is gone.
   - `/water`: list renders on load; navigate away and back within 10s: **no** second `type/11` request (cache); after 10s there is.
   - Nav "active" class follows the route.
   - The Pace loading bar still shows on first load.
5. Network tab: each of the three routes is a separate lazy chunk.

## Idempotence and Recovery

- Every milestone ends in a commit/backup (M0). To redo a hop: `git reset --hard` to the previous commit, delete `node_modules`, re-run `npm install` under the Node version for that hop.
- `ng update` refuses to run on a dirty tree; commit first.
- `ng generate @angular/core:*` migrations can be re-run safely; review diffs because they are not perfectly formatted.
- If `package-lock.json` gets inconsistent: delete `node_modules` and the lock file only after a commit, then `npm install`.

## Risks

- **Old tooling vs Node 24** (M1): mitigated by per-hop Node versions, or by D2 fallback.
- **`ng-http-caching` Angular 21 support** unknown until checked (M4). Fallback is a small interceptor.
- **`ngx-disable-during-ajax` abandoned**: removed, no replacement needed.
- **`rxResource` API drift** between v19 (`request/loader`, experimental) and v20+ (`params/stream`): only write the v20+ form, after the hop to 20.
- **`useDefineForClassFields`** field-order breakage after target bump (M2): avoided by `inject()` or the temporary flag.
- **Stringified `"null"` option value** in Search (M6): small existing bug, handled explicitly.

## Interfaces and artifacts at the end

- New: `src/app/app.config.ts`, `src/app/app.routes.ts`.
- Removed: `app.module.ts`, `app-routing.module.ts`, `polyfills.ts` (and likely `test.ts`).
- Changed: `main.ts`, `angular.json`, `tsconfig*.json`, `package.json`, all components/specs/templates, `http.service.ts`, `README.md`.
- Unchanged: `interfaces/*`, `assets/*`, `externalJSLibraries/pace/*`, `*.scss` (except possible `@use` path).
