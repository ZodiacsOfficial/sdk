# @zodiacs/widgets

Tiny typed browser mounts for the three official Zodiacs.org iframe widgets:

- Moon phase today: `/embed/moon/`
- The sky today: `/embed/sky/`
- Mini birth chart: `/embed/chart/`

The package renders no astrology itself and contains no ephemeris or place
data. It mounts the first-party embed documents, which carry the canonical
zodiac icons and the required `Powered by Zodiacs.org` backlink.

```sh
pnpm add @zodiacs/widgets
```

## Moon phase

```ts
import { mountMoonWidget } from "@zodiacs/widgets";

const widget = mountMoonWidget("#moon-widget", {
  theme: "dark",
  accent: "#7B6DA8"
});

// Later, if the host view is removed:
widget.destroy();
```

## Sky today

```ts
import { mountSkyWidget } from "@zodiacs/widgets";

mountSkyWidget(document.querySelector("aside")!, {
  theme: "light",
  height: 340,
  title: "Current planetary transits"
});
```

## Mini birth chart

```ts
import { mountChartWidget } from "@zodiacs/widgets";

mountChartWidget("#birth-chart-widget", {
  theme: "dark",
  height: 720,
  loading: "eager"
});
```

## Framework-neutral contract

Use `createWidgetEmbedContract` when a framework owns iframe rendering:

```ts
import { createWidgetEmbedContract } from "@zodiacs/widgets";

const embed = createWidgetEmbedContract("moon", {
  theme: "light",
  accent: "#B06F52"
});

console.log(embed.src, embed.sandbox, embed.branding);
```

`createWidgetUrl` is available when only the canonical `src` is needed. The
default origin is `https://zodiacs.org`; an absolute HTTP(S) `origin` override
is supported for local development and first-party mirrors. Any path on the
override is discarded because the embed routes are origin-rooted.

`accent` accepts an opaque six-digit hexadecimal color. The first-party iframe
documents adjust its luminance when needed so the effective accent reaches
WCAG AA (4.5:1) contrast against the selected light or dark field.

## Required iframe contract

Every official embed document must render this attribution inside the iframe:

```txt
Powered by Zodiacs.org → https://zodiacs.org/
```

The contract marks it as required and non-removable, and the package exposes no
option to hide, relabel, or redirect it. The route documents should open the
link in a new tab with `rel="noopener"`. Hosts can style or size the iframe but
must not proxy or rewrite its contents to remove attribution.

Mounted iframes use this sandbox policy:

```txt
allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox
```

They also use `strict-origin-when-cross-origin` referrers so the embed service
can count referring origins without receiving full host URLs. The package adds
no analytics, cookies, storage, wallet access, signing, or transaction code.
