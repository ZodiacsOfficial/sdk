export const WIDGET_KINDS = ["moon", "sky", "chart"] as const;
export type WidgetKind = (typeof WIDGET_KINDS)[number];

export type WidgetTheme = "dark" | "light";
export type WidgetLoading = "lazy" | "eager";

export const DEFAULT_WIDGET_ORIGIN = "https://zodiacs.org";

export const WIDGET_ROUTES = Object.freeze({
  moon: "/embed/moon/",
  sky: "/embed/sky/",
  chart: "/embed/chart/"
}) satisfies Readonly<Record<WidgetKind, string>>;

export const WIDGET_SANDBOX =
  "allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox";

/**
 * Required content contract for every document served by `WIDGET_ROUTES`.
 * The package intentionally exposes no option that can disable or alter it.
 */
export const REQUIRED_IFRAME_BRANDING = Object.freeze({
  label: "Powered by Zodiacs.org",
  href: "https://zodiacs.org/",
  target: "_blank",
  rel: "noopener",
  location: "inside-iframe",
  required: true,
  removable: false
} as const);

const DEFAULT_TITLES = Object.freeze({
  moon: "Moon phase today — Zodiacs.org",
  sky: "The sky today — Zodiacs.org",
  chart: "Mini birth chart — Zodiacs.org"
}) satisfies Readonly<Record<WidgetKind, string>>;

const DEFAULT_HEIGHTS = Object.freeze({
  moon: 420,
  sky: 300,
  chart: 640
}) satisfies Readonly<Record<WidgetKind, number>>;

export interface WidgetAppearanceOptions {
  theme?: WidgetTheme;
  /** Opaque six-digit hexadecimal host accent, for example `#7B6DA8`. */
  accent?: string;
}

export interface WidgetUrlOptions extends WidgetAppearanceOptions {
  /** Override for development or a first-party mirror. Only HTTP(S) origins are accepted. */
  origin?: string | URL;
}

export interface WidgetMountOptions extends WidgetUrlOptions {
  /** Accessible iframe title. */
  title?: string;
  /** CSS-pixel iframe height. */
  height?: number;
  loading?: WidgetLoading;
  className?: string;
}

export interface WidgetEmbedContract {
  readonly kind: WidgetKind;
  readonly src: string;
  readonly title: string;
  readonly height: number;
  readonly theme: WidgetTheme;
  readonly sandbox: typeof WIDGET_SANDBOX;
  readonly referrerPolicy: "strict-origin-when-cross-origin";
  readonly branding: typeof REQUIRED_IFRAME_BRANDING;
}

export interface MountedWidget {
  readonly kind: WidgetKind;
  readonly iframe: HTMLIFrameElement;
  readonly contract: WidgetEmbedContract;
  destroy(): void;
}

function assertKind(kind: WidgetKind): void {
  if (!WIDGET_KINDS.includes(kind)) {
    throw new RangeError(`Unknown Zodiacs.org widget: ${String(kind)}`);
  }
}

function normalizeTheme(theme: WidgetTheme | undefined): WidgetTheme {
  const value = theme ?? "dark";
  if (value !== "dark" && value !== "light") {
    throw new RangeError("theme must be either dark or light.");
  }
  return value;
}

function normalizeAccent(accent: string | undefined): string | undefined {
  if (accent === undefined) return undefined;
  if (!/^#[0-9a-f]{6}$/iu.test(accent)) {
    throw new RangeError("accent must be a six-digit hexadecimal color such as #7B6DA8.");
  }
  return accent.toUpperCase();
}

function normalizeOrigin(origin: string | URL | undefined): URL {
  let parsed: URL;
  try {
    parsed = new URL(origin?.toString() ?? DEFAULT_WIDGET_ORIGIN);
  } catch {
    throw new RangeError("origin must be an absolute HTTP(S) URL.");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new RangeError("origin must use HTTP or HTTPS.");
  }
  if (parsed.username || parsed.password) {
    throw new RangeError("origin must not include credentials.");
  }
  return new URL(`${parsed.origin}/`);
}

function normalizeHeight(kind: WidgetKind, height: number | undefined): number {
  const value = height ?? DEFAULT_HEIGHTS[kind];
  if (!Number.isInteger(value) || value < 120 || value > 2_000) {
    throw new RangeError("height must be an integer from 120 through 2000.");
  }
  return value;
}

/** Build the canonical iframe URL without accessing the DOM. */
export function createWidgetUrl(kind: WidgetKind, options: WidgetUrlOptions = {}): string {
  assertKind(kind);
  const theme = normalizeTheme(options.theme);
  const accent = normalizeAccent(options.accent);
  const source = new URL(WIDGET_ROUTES[kind], normalizeOrigin(options.origin));
  source.searchParams.set("theme", theme);
  if (accent) source.searchParams.set("accent", accent);
  return source.href;
}

/** Framework-neutral attributes and the mandatory in-iframe branding contract. */
export function createWidgetEmbedContract(
  kind: WidgetKind,
  options: WidgetMountOptions = {}
): WidgetEmbedContract {
  const theme = normalizeTheme(options.theme);
  return Object.freeze({
    kind,
    src: createWidgetUrl(kind, options),
    title: options.title?.trim() || DEFAULT_TITLES[kind],
    height: normalizeHeight(kind, options.height),
    theme,
    sandbox: WIDGET_SANDBOX,
    referrerPolicy: "strict-origin-when-cross-origin",
    branding: REQUIRED_IFRAME_BRANDING
  });
}

function isMountTarget(value: unknown): value is HTMLElement {
  return Boolean(
    value &&
    typeof value === "object" &&
    "appendChild" in value &&
    typeof (value as { appendChild?: unknown }).appendChild === "function"
  );
}

function resolveMountTarget(target: HTMLElement | string): HTMLElement {
  if (isMountTarget(target)) return target;
  const documentObject = globalThis.document;
  if (!documentObject) {
    throw new Error("Mounting a Zodiacs.org widget requires a browser document.");
  }
  const found = documentObject.querySelector<HTMLElement>(target);
  if (!found) throw new Error(`Widget mount target not found: ${target}`);
  return found;
}

/** Mount a sandboxed official iframe without replacing other host content. */
export function mountWidget(
  kind: WidgetKind,
  target: HTMLElement | string,
  options: WidgetMountOptions = {}
): MountedWidget {
  const mountTarget = resolveMountTarget(target);
  const documentObject = mountTarget.ownerDocument ?? globalThis.document;
  if (!documentObject) {
    throw new Error("Mounting a Zodiacs.org widget requires a browser document.");
  }
  const contract = createWidgetEmbedContract(kind, options);
  const iframe = documentObject.createElement("iframe");

  iframe.src = contract.src;
  iframe.title = contract.title;
  iframe.loading = options.loading ?? "lazy";
  iframe.referrerPolicy = contract.referrerPolicy;
  iframe.className = options.className ?? "";
  iframe.setAttribute("sandbox", contract.sandbox);
  iframe.setAttribute("width", "100%");
  iframe.setAttribute("height", String(contract.height));
  iframe.setAttribute("data-zodiacs-widget", kind);
  iframe.setAttribute("data-zodiacs-branding", "required");
  iframe.style.display = "block";
  iframe.style.width = "100%";
  iframe.style.height = `${contract.height}px`;
  iframe.style.border = "0";
  iframe.style.colorScheme = contract.theme;

  mountTarget.appendChild(iframe);
  return Object.freeze({
    kind,
    iframe,
    contract,
    destroy() {
      iframe.remove();
    }
  });
}

export function mountMoonWidget(
  target: HTMLElement | string,
  options?: WidgetMountOptions
): MountedWidget {
  return mountWidget("moon", target, options);
}

export function mountSkyWidget(
  target: HTMLElement | string,
  options?: WidgetMountOptions
): MountedWidget {
  return mountWidget("sky", target, options);
}

export function mountChartWidget(
  target: HTMLElement | string,
  options?: WidgetMountOptions
): MountedWidget {
  return mountWidget("chart", target, options);
}
