import { expect, test } from "bun:test";

const systemd = (name: string) => Bun.file(new URL(`../contrib/systemd/${name}`, import.meta.url));

test("browser title is the product name Route", async () => {
  const html = await Bun.file(new URL("../web/index.html", import.meta.url)).text();
  expect(html).toContain("<title>Route</title>");
  expect(html).not.toContain("OpenCode Routing Dashboard");
  expect(html).not.toContain("UseRoute");
});

test("systemd units call the useroute bin", async () => {
  const service = systemd("useroute.service");
  const snapshot = systemd("useroute-snapshot.service");
  const timer = systemd("useroute-snapshot.timer");
  expect(await service.exists()).toBe(true);
  expect(await snapshot.exists()).toBe(true);
  expect(await timer.exists()).toBe(true);
  expect(await service.text()).toContain("ExecStart=/usr/bin/env useroute serve");
  expect(await service.text()).toContain("Description=Route");
  expect(await snapshot.text()).toContain("ExecStart=/usr/bin/env useroute snapshot");
  expect(await timer.text()).toContain("Description=Capture a Route snapshot weekly");
  for (const old of [
    "opencode-routing-dashboard.service",
    "opencode-routing-dashboard-snapshot.service",
    "opencode-routing-dashboard-snapshot.timer",
  ])
    expect(await systemd(old).exists()).toBe(false);
  const migration = await Bun.file(new URL("../contrib/systemd/README.md", import.meta.url)).text();
  expect(migration).toContain("systemctl --user disable --now opencode-routing-dashboard.service");
  expect(migration).toContain("systemctl --user disable --now opencode-routing-dashboard-snapshot.timer");
  expect(migration).toContain("systemctl --user enable --now useroute.service");
  expect(migration).toContain("systemctl --user enable --now useroute-snapshot.timer");
  expect(migration).not.toContain("UseRoute");
});

test("favicon is the BRAND Y-node: white centre, three cyan lines with dots, #0A0A0B background", async () => {
  const svg = await Bun.file(new URL("../web/assets/favicon.svg", import.meta.url)).text();
  const up = svg.toUpperCase();
  expect(up).toContain("#22D3EE");
  expect(up).toContain("#0A0A0B");
  expect(up).not.toContain("#000000");
  expect(up).not.toMatch(/#000(?![0-9A-F])/);
  // Old amber icon is gone.
  for (const old of ["#FFB000", "#0E0F0C", "#E8E4D8", "#8C8A80"]) expect(up).not.toContain(old);
  expect(svg).not.toContain("stroke-dasharray");
  // Three lines, three end dots, one white centre circle; no glow, gradient or filter.
  expect(svg.match(/<line\b/g)).toHaveLength(3);
  expect(svg.match(/<circle\b/g)).toHaveLength(4);
  expect(svg).toMatch(/<circle[^>]*fill="#F4F4F5"/i);
  expect(svg).not.toMatch(/gradient|filter|blur|shadow/i);
  // Square tile: no rounded corners beyond the geometric node.
  expect(svg).not.toMatch(/\srx=/);
});

test("index.html points at the favicon and loads local font css", async () => {
  const html = await Bun.file(new URL("../web/index.html", import.meta.url)).text();
  expect(html).toContain("/assets/favicon.svg");
  expect(html).not.toMatch(/https?:\/\//);
});
