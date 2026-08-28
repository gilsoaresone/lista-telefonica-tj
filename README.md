# ListaTelefonicaTj

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.35.

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

## Publicação no GitHub Pages

O workflow em `.github/workflows/deploy-pages.yml` publica automaticamente a aplicação a cada push na branch `main`.

Depois de criar o repositório no GitHub:

```bash
git init
git add .
git commit -m "Publica lista telefônica Angular"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/lista-telefonica-tj.git
git push -u origin main
```

No GitHub, acesse **Settings > Pages** e selecione **GitHub Actions** como fonte. A URL será `https://SEU_USUARIO.github.io/lista-telefonica-tj/`.
