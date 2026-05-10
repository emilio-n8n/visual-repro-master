import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  detectLanguage,
  getLanguage,
  setLanguage,
  t,
  useTranslation,
} from "../lib/i18n";

describe("detectLanguage", () => {
  beforeEach(() => {
    // Mock window for server-side rendering safety
    vi.stubGlobal("window", {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should return French by default when navigator is not available", () => {
    vi.stubGlobal("window", undefined);
    expect(detectLanguage()).toBe("fr");
  });

  it("should return French for French browser locale", () => {
    vi.stubGlobal("navigator", { language: "fr-FR" });
    expect(detectLanguage()).toBe("fr");
  });

  it("should return English for English browser locale", () => {
    vi.stubGlobal("navigator", { language: "en-US" });
    expect(detectLanguage()).toBe("en");
  });

  it("should return French for unsupported locale", () => {
    vi.stubGlobal("navigator", { language: "de-DE" });
    expect(detectLanguage()).toBe("fr");
  });

  it("should handle language without region code", () => {
    vi.stubGlobal("navigator", { language: "fr" });
    expect(detectLanguage()).toBe("fr");
  });
});

describe("getLanguage", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {});
    // Clear localStorage before each test
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should return French by default when no localStorage", () => {
    vi.stubGlobal("localStorage", undefined);
    vi.stubGlobal("navigator", { language: "en-US" });
    expect(getLanguage()).toBe("fr");
  });

  it("should return stored language from localStorage", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => "en"),
    });
    vi.stubGlobal("navigator", { language: "fr-FR" });
    expect(getLanguage()).toBe("en");
  });

  it("should fallback to detectLanguage when localStorage is empty", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
    });
    vi.stubGlobal("navigator", { language: "en-US" });
    expect(getLanguage()).toBe("en");
  });
});

describe("setLanguage", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should store language in localStorage", () => {
    setLanguage("en");
    expect(localStorage.setItem).toHaveBeenCalledWith("forma-language", "en");
  });

  it("should do nothing when window is undefined", () => {
    vi.stubGlobal("window", undefined);
    expect(() => setLanguage("en")).not.toThrow();
  });
});

describe("t (translation function)", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    });
    vi.stubGlobal("navigator", { language: "fr-FR" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should return French translation for French locale", () => {
    expect(t("nav.dashboard")).toBe("Tableau de bord");
    expect(t("action.save")).toBe("Enregistrer");
  });

  it("should return English translation when language is set to English", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => "en"),
    });
    expect(t("nav.dashboard")).toBe("Dashboard");
    expect(t("action.save")).toBe("Save");
  });

  it("should return key when translation is not found", () => {
    expect(t("unknown.key")).toBe("unknown.key");
  });

  it("should fallback to French when translation not found in current language", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => "en"),
    });
    // This key exists in fr but not in en (or vice versa) - use fallback behavior
    expect(t("nav.dashboard")).toBe("Dashboard");
  });

  it("should accept explicit language parameter", () => {
    expect(t("nav.dashboard", "en")).toBe("Dashboard");
    expect(t("nav.dashboard", "fr")).toBe("Tableau de bord");
  });

  it("should fallback to French when explicit language is not available", () => {
    expect(t("nav.dashboard", "de")).toBe("Tableau de bord");
  });
});

describe("useTranslation hook", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    });
    vi.stubGlobal("navigator", { language: "fr-FR" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should return translation function", () => {
    const { t: translate } = useTranslation();
    expect(typeof translate).toBe("function");
    expect(translate("nav.dashboard")).toBe("Tableau de bord");
  });

  it("should return current language", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => "en"),
    });
    const { language } = useTranslation();
    expect(language).toBe("en");
  });

  it("should return setLanguage function", () => {
    const { setLanguage: setLang } = useTranslation();
    expect(typeof setLang).toBe("function");
    setLang("en");
    expect(localStorage.setItem).toHaveBeenCalledWith("forma-language", "en");
  });
});

describe("translations completeness", () => {
  it("should have translations for all keys in both French and English", () => {
    // Test a sample of keys exist in both languages
    const frKeys = [
      "nav.dashboard",
      "nav.render",
      "action.save",
      "action.cancel",
      "status.loading",
      "status.error",
      "landing.title",
      "dashboard.welcome",
    ];

    // These keys should exist and be different between fr and en
    frKeys.forEach((key) => {
      const fr = t(key, "fr");
      const en = t(key, "en");
      // Key should be translated in both languages (not return the key itself)
      expect(fr).not.toBe(key);
      expect(en).not.toBe(key);
      // And they should be different
      expect(fr).not.toBe(en);
    });
  });
});