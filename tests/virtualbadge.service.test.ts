import { afterEach, describe, expect, it, vi } from "vitest";
import { getVirtualBadgeTemplateId } from "../src/services/virtualbadge.service";

describe("getVirtualBadgeTemplateId", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the default VirtualBadge template outside Brazil", () => {
    vi.stubEnv("VIRTUALBADGE_TEMPLATE_GLOBAL_CHAMPION", "default-champion-template");
    vi.stubEnv("VIRTUALBADGE_TEMPLATE_NOMAD_GLOBAL_CHAMPION", "nomad-champion-template");

    expect(getVirtualBadgeTemplateId("Global Champion", "Argentina")).toBe("default-champion-template");
  });

  it("uses the Nomad Global Champion template for Brazil", () => {
    vi.stubEnv("VIRTUALBADGE_TEMPLATE_GLOBAL_CHAMPION", "default-champion-template");
    vi.stubEnv("VIRTUALBADGE_TEMPLATE_NOMAD_GLOBAL_CHAMPION", "nomad-champion-template");

    expect(getVirtualBadgeTemplateId("Global Champion", "BR")).toBe("nomad-champion-template");
  });

  it("uses the Nomad Global Leader template for Brazil", () => {
    vi.stubEnv("VIRTUALBADGE_TEMPLATE_GLOBAL_LEADER", "default-leader-template");
    vi.stubEnv("VIRTUALBADGE_TEMPLATE_NOMAD_GLOBAL_LEADER", "nomad-leader-template");

    expect(getVirtualBadgeTemplateId("Global Leader", "Brazil")).toBe("nomad-leader-template");
  });

  it("uses the Nomad Global Talent template for Brazil", () => {
    vi.stubEnv("VIRTUALBADGE_TEMPLATE_GLOBAL_TALENT", "default-talent-template");
    vi.stubEnv("VIRTUALBADGE_TEMPLATE_NOMAD_GLOBAL_TALENT", "nomad-talent-template");

    expect(getVirtualBadgeTemplateId("Global Talent", "Brasil")).toBe("nomad-talent-template");
  });
});
