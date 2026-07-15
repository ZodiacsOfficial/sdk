import { afterEach, describe, expect, it, vi } from "vitest";

import {
  REQUIRED_IFRAME_BRANDING,
  WIDGET_ROUTES,
  WIDGET_SANDBOX,
  createWidgetEmbedContract,
  createWidgetUrl,
  mountChartWidget,
  mountSkyWidget
} from "./index.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("widget URL contract", () => {
  it("uses the three coordinated site routes", () => {
    expect(WIDGET_ROUTES).toEqual({
      moon: "/embed/moon/",
      sky: "/embed/sky/",
      chart: "/embed/chart/"
    });
    expect(createWidgetUrl("moon")).toBe("https://zodiacs.org/embed/moon/?theme=dark");
  });

  it("encodes theme and a normalized host accent", () => {
    const url = new URL(
      createWidgetUrl("sky", {
        theme: "light",
        accent: "#7b6da8",
        origin: "http://localhost:4321/nested/path"
      })
    );
    expect(url.origin).toBe("http://localhost:4321");
    expect(url.pathname).toBe("/embed/sky/");
    expect(url.searchParams.get("theme")).toBe("light");
    expect(url.searchParams.get("accent")).toBe("#7B6DA8");
  });

  it("rejects malformed appearance and origin values", () => {
    expect(() => createWidgetUrl("moon", { accent: "red" })).toThrowError(/six-digit hexadecimal/u);
    expect(() => createWidgetUrl("moon", { theme: "system" as "dark" })).toThrowError(
      /dark or light/u
    );
    expect(() => createWidgetUrl("moon", { origin: "javascript:alert(1)" })).toThrowError(
      /HTTP or HTTPS/u
    );
  });
});

describe("embed contract", () => {
  it("makes fixed in-iframe attribution part of every contract", () => {
    const contract = createWidgetEmbedContract("chart");
    expect(contract.branding).toBe(REQUIRED_IFRAME_BRANDING);
    expect(contract.branding).toEqual({
      label: "Powered by Zodiacs.org",
      href: "https://zodiacs.org/",
      target: "_blank",
      rel: "noopener",
      location: "inside-iframe",
      required: true,
      removable: false
    });
    expect(Object.isFrozen(contract)).toBe(true);
    expect(Object.isFrozen(contract.branding)).toBe(true);
    expect(contract.sandbox).toBe(WIDGET_SANDBOX);
    expect(contract.referrerPolicy).toBe("strict-origin-when-cross-origin");
  });

  it("uses accessible titles and bounded per-widget heights", () => {
    expect(createWidgetEmbedContract("moon").title).toContain("Moon phase");
    expect(createWidgetEmbedContract("chart", { title: "Birth chart", height: 720 })).toMatchObject(
      { title: "Birth chart", height: 720 }
    );
    expect(() => createWidgetEmbedContract("sky", { height: 40 })).toThrowError(
      /120 through 2000/u
    );
  });
});

describe("browser mounting", () => {
  function fakeBrowser() {
    const attributes = new Map<string, string>();
    const iframe = {
      src: "",
      title: "",
      loading: "",
      referrerPolicy: "",
      className: "",
      style: {} as Record<string, string>,
      removed: false,
      setAttribute(name: string, value: string) {
        attributes.set(name, value);
      },
      remove() {
        this.removed = true;
      }
    };
    const children: unknown[] = [];
    const documentObject = {
      querySelector: vi.fn(),
      createElement: vi.fn(() => iframe)
    };
    const target = {
      ownerDocument: documentObject,
      appendChild(node: unknown) {
        children.push(node);
        return node;
      }
    };
    documentObject.querySelector.mockReturnValue(target);
    vi.stubGlobal("document", documentObject);
    return { attributes, children, documentObject, iframe, target };
  }

  it("mounts a sandboxed iframe by selector and destroys it", () => {
    const browser = fakeBrowser();
    const mounted = mountSkyWidget("#sky", {
      theme: "light",
      accent: "#AABBCC",
      height: 440,
      className: "host-widget"
    });

    expect(browser.documentObject.querySelector).toHaveBeenCalledWith("#sky");
    expect(browser.children).toEqual([browser.iframe]);
    expect(browser.iframe.src).toContain("/embed/sky/?theme=light&accent=%23AABBCC");
    expect(browser.iframe.className).toBe("host-widget");
    expect(browser.iframe.style).toMatchObject({
      width: "100%",
      height: "440px",
      border: "0",
      colorScheme: "light"
    });
    expect(browser.attributes.get("sandbox")).toBe(WIDGET_SANDBOX);
    expect(browser.attributes.get("data-zodiacs-branding")).toBe("required");

    mounted.destroy();
    expect(browser.iframe.removed).toBe(true);
  });

  it("accepts an element target without a global selector", () => {
    const browser = fakeBrowser();
    mountChartWidget(browser.target as unknown as HTMLElement);
    expect(browser.documentObject.querySelector).not.toHaveBeenCalled();
    expect(browser.attributes.get("data-zodiacs-widget")).toBe("chart");
  });

  it("fails clearly when a selector has no browser document", () => {
    vi.stubGlobal("document", undefined);
    expect(() => mountSkyWidget("#missing")).toThrowError(/browser document/u);
  });
});
