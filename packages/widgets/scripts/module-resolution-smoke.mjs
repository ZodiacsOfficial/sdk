import assert from "node:assert/strict";

const widgets = await import("@zodiacs/widgets");

for (const name of [
  "createWidgetUrl",
  "createWidgetEmbedContract",
  "mountWidget",
  "mountMoonWidget",
  "mountSkyWidget",
  "mountChartWidget"
]) {
  assert.equal(typeof widgets[name], "function", `missing export: ${name}`);
}

assert.equal(widgets.createWidgetUrl("moon"), "https://zodiacs.org/embed/moon/?theme=dark");
assert.equal(widgets.REQUIRED_IFRAME_BRANDING.required, true);
assert.equal(widgets.REQUIRED_IFRAME_BRANDING.removable, false);

console.log("@zodiacs/widgets export smoke test passed");
