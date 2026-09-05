# Float documentation

The site renders Float 2.0 documentation from `content/float.md`, copied verbatim
from the supplied `float-docs/README.md`. The copy is part of this application so
deployments do not depend on the nested `float-docs` Git repository.

To update the published text, edit `content/float.md` or copy the updated source:

```sh
cp float-docs/README.md content/float.md
```

The introduction and each second-level heading become a page. Part headings group
the sidebar navigation. Tables, fenced code, and subsection anchors are rendered
from Markdown. The existing Float theme and animated background remain in use.

```sh
bun install
bun dev
bun run build
bun run lint
```
