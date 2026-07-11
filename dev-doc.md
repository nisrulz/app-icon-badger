# Development

The web app uses

- [Vue.js](https://vuejs.org/) - For templating and reactive updates in the DOM
- [GitHub Pages](https://pages.github.com/) - For hosting the static web app
- CLI Tools
  - [pug](https://github.com/tokilabs/pug3-cli) - To convert pug templates to html and merge partials into a single [`index.html`](public/index.html) file.

---

Install the CLI tools using

```sh
npm install -g @tokilabs/pug3-cli
```

If you wish to modify the code for the webapp, then look into the [`src`](src) directory.

The webapp is set up so that it is made up of html partials written in the pug templating language, all of which are compiled into a single `index.html` file which lives under the [`public`](public) directory.

To compile the code under the `src` folder, simply execute the helper bash script [`render.sh`](render.sh) at the root of the repo inside a terminal:

```sh
./render.sh
```

This will generate the `index.html` file at the required directory path.

Open `index.html` to view the full web app 🎉

## Update

To update packages in the project, run: `npm update`

## Deployment

The site is built and deployed to GitHub Pages automatically via the
[`deploy-pages.yml`](.github/workflows/deploy-pages.yml) workflow on every push to `master`.

### Serve and test locally

To build and serve locally for testing, run:

```sh
make serve
```
