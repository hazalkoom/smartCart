# Frontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.2.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Deploy On Vercel

This repository is a monorepo. The Vercel project can target the repo root and use the root-level `vercel.json` to build and deploy the Angular frontend as a static site.

### What is configured

- Build command: `npm --prefix frontend install && npm --prefix frontend run build`
- Output directory: `frontend/dist/frontend/browser`
- SPA fallback rewrite to `index.html` for client-side routes

### Deploy steps

1. Import the Git repository into Vercel.
2. Keep the default Root Directory as repository root.
3. Deploy. Vercel reads `vercel.json` automatically.

### Environment notes

- Frontend production API URL is configured in `src/environments/environment.prod.ts`.
- If you later move backend APIs, update the production environment file and redeploy.
