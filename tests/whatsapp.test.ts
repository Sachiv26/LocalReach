import { describe, it, expect } from "vitest";
import {
  generateWhatsAppText,
  renderWhatsAppTemplate,
  whatsappShareLink,
} from "@/lib/whatsapp/templates";

describe("renderWhatsAppTemplate", () => {
  it("replaces known variables", () => {
    const out = renderWhatsAppTemplate("Hello {{title}} — {{price}}", { title: "Sofa", price: "R500" });
    expect(out).toBe("Hello Sofa — R500");
  });

  it("drops unknown variables", () => {
    const out = renderWhatsAppTemplate("Hello {{unknown}}", {});
    expect(out).toBe("Hello ");
  });
});

describe("generateWhatsAppText", () => {
  const data = {
    title: "3 Bedroom Home",
    price: "R1,850,000",
    description: "Beautiful family home",
    location: "Umgeni Park",
    contactName: "John",
    contactPhone: "0821234567",
    whatsappNumber: "0821234567",
    url: "https://localreach.example/ads/home",
    communityName: "Umgeni Park",
  };

  it("generates a short version", () => {
    const out = generateWhatsAppText("SHORT", data);
    expect(out).toContain("3 Bedroom Home");
    expect(out).toContain("R1,850,000");
    expect(out).toContain("wa.me");
  });

  it("generates a detailed version", () => {
    const out = generateWhatsAppText("DETAILED", data);
    expect(out).toContain("Beautiful family home");
    expect(out).toContain("John");
  });
});

describe("whatsappShareLink", () => {
  it("encodes text for wa.me", () => {
    const link = whatsappShareLink("Hello world");
    expect(link).toBe("https://wa.me/?text=Hello%20world");
  });
});
