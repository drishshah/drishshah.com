# Drish Shah portfolio

Static site: plain HTML, CSS and JS. No build step.

```
index.html        page
css/style.css     styles
js/gripper.js     rotating ASCII render of the TRACE Lab rail gripper
js/main.js        project data, project layer, ASCII animation loop
assets/covers/    blue outline covers (one per project)
assets/photos/    project photos shown inside each project layer
Drish_Shah_Resume.pdf  linked from the nav, bio and footer
```

## Edit content

* Project text and photo captions: the `PROJECTS` object at the top of `js/main.js`.
* Card text: the matching `<article class="card">` in `index.html`.
* Add a photo: drop a `.webp` (about 1600 px on the long side) into `assets/photos/<project>/` and add a line to that project's `photos` list.
* Swap the resume: replace `Drish_Shah_Resume.pdf` (keep the same name so every link still works).

## Publish on GitHub Pages

1. Create a public repo, upload everything in this folder to its root.
2. Repo Settings > Pages > Source: "Deploy from a branch", branch `main`, folder `/ (root)`.
3. Custom domain: the `CNAME` file already contains `drishshah.com`. In Pages settings, enter `drishshah.com` as the custom domain.
4. At your domain registrar, add four A records for `drishshah.com` pointing to GitHub Pages (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153) and a CNAME record for `www` pointing to `<username>.github.io`. Tick "Enforce HTTPS" once it becomes available.
