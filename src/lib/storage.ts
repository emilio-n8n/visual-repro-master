// Local storage utilities with type safety

type StorageValue = string | number | boolean | object | null;

class Storage {
  private prefix = "forma_";

  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (error) {
      console.error("[Storage] Failed to set item:", error);
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key));
  }

  // Specific helpers
  getToken(): string | null {
    return this.get<string>("auth_token");
  }

  setToken(token: string): void {
    this.set("auth_token", token);
  }

  removeToken(): void {
    this.remove("auth_token");
  }

  getTheme(): "dark" | "light" {
    return this.get<"dark" | "light">("theme", "dark") || "dark";
  }

  setTheme(theme: "dark" | "light"): void {
    this.set("theme", theme);
  }

  getLanguage(): string {
    return this.get<string>("language", "fr") || "fr";
  }

  setLanguage(lang: string): void {
    this.set("language", lang);
  }

  hasSeenTour(): boolean {
    return this.get<boolean>("tour_seen", false) || false;
  }

  setTourSeen(): void {
    this.set("tour_seen", true);
  }
}

export const storage = new Storage();

export default storage;