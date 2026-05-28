# GitHub Copilot Instructions

## Support Level

- Favor elegant, maintainable solutions over verbose code. Assume understanding of language idioms and design patterns.
- Highlight potential performance implications and optimization opportunities in suggested code.
- Frame solutions within broader architectural contexts and suggest design alternatives when appropriate.
- Focus comments on 'why' not 'what' — assume code readability through well-named functions and variables.
- Proactively address edge cases, race conditions, and security considerations without being prompted.
- When debugging, provide targeted diagnostic approaches rather than shotgun solutions.
- Suggest comprehensive testing strategies rather than just example tests, including considerations for mocking, test organization, and coverage.

---

## Architecture — DDD

- Define bounded contexts to separate different parts of the domain with clear boundaries.
- Implement ubiquitous language within each context to align code with business terminology.
- Create rich domain models with behavior, not just data structures.
- Use value objects for concepts with no identity but defined by their attributes.
- Implement domain events to communicate between bounded contexts.
- Use aggregates to enforce consistency boundaries and transactional integrity.

---

## React Coding Standards

- Use functional components with hooks instead of class components.
- Implement `React.memo()` for expensive components that render often with the same props.
- Utilize `React.lazy()` and `Suspense` for code-splitting and performance optimization.
- Use `useCallback` for event handlers passed to child components to prevent unnecessary re-renders.
- Prefer `useMemo` for expensive calculations to avoid recomputation on every render.
- Implement `useId()` for generating unique IDs for accessibility attributes.
- Use `useTransition` for non-urgent state updates to keep the UI responsive.
- Consider `useOptimistic` for optimistic UI updates in forms.

---

## React Router

- Use `createBrowserRouter` instead of `BrowserRouter` for better data loading and error handling.
- Implement lazy loading with `React.lazy()` for route components to improve initial load time.
- Use the `useNavigate` hook instead of the navigate component prop for programmatic navigation.
- Leverage `loader` and `action` functions to handle data fetching and mutations at the route level.
- Implement error boundaries with `errorElement` to gracefully handle routing and data errors.
- Use relative paths with dot notation (e.g., `"../parent"`) to maintain route hierarchy flexibility.
- Utilize `useRouteLoaderData` to access data from parent routes.
- Implement fetchers for non-navigation data mutations.
- Use `route.lazy()` for route-level code splitting with automatic loading states.
- Implement `shouldRevalidate` functions to control when data revalidation happens after navigation.

---

## PrimeReact

- Use PrimeReact components as the default UI building blocks instead of custom HTML when possible.
- Prefer PrimeReact layout and form components (`Card`, `Button`, `InputText`, `DataTable`) for consistent styling.
- Keep custom components as thin wrappers around PrimeReact to avoid duplicating behavior.
- When extending, follow PrimeReact theming and pass-through props rather than overriding styles directly.

---

## PrimeFlex

- Use PrimeFlex utility classes for layout, spacing, and responsive behavior instead of bespoke CSS when possible.
- Prefer PrimeFlex grid/flex utilities (`grid`, `col-12`, `md:col-6`, `flex`, `gap-2`) for structure and alignment.
- Keep custom CSS focused on component-specific visuals that PrimeFlex cannot express.
- Use PrimeFlex spacing scale consistently (`p-`, `m-`, `gap-`) to avoid arbitrary pixel values.
- Apply responsive variants (`sm:`, `md:`, `lg:`, `xl:`) for adaptive layouts.

---

## Static Analysis — ESLint

- Configure project-specific rules in `eslint.config.js` to enforce consistent coding standards.
- Use shareable configs as a foundation.
- Configure integration with Prettier to avoid rule conflicts.
- Use the `--fix` flag in CI/CD pipelines to automatically correct fixable issues.
- Implement staged linting with husky and lint-staged to prevent committing non-compliant code.

---

## Static Analysis — Prettier

- Define a consistent `.prettierrc` configuration across all project repositories.
- Configure editor integration to format on save for immediate feedback.
- Use `.prettierignore` to exclude generated files and build artifacts.
- Set `printWidth` based on team preferences (80–120 characters).
- Implement CI checks to ensure all committed code adheres to the defined style.

---

## Testing — Vitest

- Use `vi.fn()` for function mocks, `vi.spyOn()` to monitor existing functions, and `vi.stubGlobal()` for global mocks.
- Place `vi.mock()` factory functions at the top level of test files; remember the factory runs before imports are processed.
- Define global mocks, custom matchers, and environment setup in dedicated setup files referenced in `vitest.config.ts`.
- Use inline snapshots (`toMatchInlineSnapshot()`) for readable assertions.
- Configure coverage thresholds in `vitest.config.ts` only when asked — focus on meaningful tests, not arbitrary percentages.
- Run `vitest --watch` during development for instant feedback.
- Set `environment: 'jsdom'` for frontend component tests; combine with testing-library for realistic interaction simulation.
- Follow Arrange-Act-Assert pattern and group related tests in descriptive `describe` blocks.
- Use `expectTypeOf()` for type-level assertions; ensure mocks preserve original type signatures.

---

## Skill — Frontend Design

When building UI components, pages, or applications:

- Commit to a bold, intentional aesthetic direction before coding (brutally minimal, maximalist, retro-futuristic, editorial, etc.).
- Choose distinctive, characterful fonts — avoid generic choices like Inter, Roboto, Arial.
- Commit to a cohesive color palette with dominant colors and sharp accents.
- Use animations for high-impact moments (staggered page load reveals, hover states) — prefer CSS-only; use Motion library for React.
- Apply unexpected layouts: asymmetry, overlap, diagonal flow, generous negative space, or controlled density.
- Add atmospheric backgrounds: gradient meshes, noise textures, geometric patterns, layered transparencies.
- Never default to purple gradients on white backgrounds or other clichéd AI-generated aesthetics.
- Match implementation complexity to the aesthetic vision.

---

## Skill — React Doctor

After making React code changes, run the health check:

```bash
npx -y react-doctor@latest . --verbose --diff
```

- `--diff` — scans only changed files vs base branch (use after changes)
- `--verbose` — shows affected files and line numbers per rule
- Without `--diff` — scans full codebase (use for general cleanup)
- `--score` — outputs only the numeric score (0–100)

If the score dropped after your changes, fix regressions before committing. Fix errors first, then warnings.
