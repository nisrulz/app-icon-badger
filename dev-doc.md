# Development

The web app uses

- [VueJs](https://vuejs.org/) - For templating and reactive updates in the DOM
- [Firebase Hosting](https://firebase.google.com/docs/hosting/) - For hosting the static web app
- CLI Tools
  - [pug](https://github.com/tokilabs/pug3-cli) - To convert pug templates to html and merge partials into single [`index.html`](public/index.html) file.
  - [firebase-tools](https://github.com/firebase/firebase-tools) - To interact with Firebase as a service from command line.

---

Install the CLI tools using

```sh
npm install -g @tokilabs/pug3-cli sass js-yaml \
firebase-tools
```

If you wish to modify the code for the webapp, then look into [`src`](src) directory.

The webapp is setup in a way that it is made up of html partials written in pug templating language, all of which is compiled into a single `index.html` file which lives under [`public`](public) directory.

To compile the code under `src` folder, simply execute the helper bash script [`render.sh`](render.sh) at the root of the repo inside a terminal:

```sh
./render.sh
```

This will generate the `index.html` file at the required directory path.

Open `index.html` to view the full web app 🎉

## Update

To update packages in the project, run: `npm update`

## Deployment

### Server and test locally

To serve locally for testing, run: `firebase serve --only hosting`

### Deploy to Production

> **Warning**
> This can only be done by maintainers who have access to Firebase console!

- First, login by executing command: `firebase login`
- Next,To deploy to production,run: `firebase deploy -m "1.0.0"`
