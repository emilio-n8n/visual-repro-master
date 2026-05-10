import { describe, it, expect } from "vitest";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

describe("cn (classNames)", () => {
  function cn(...inputs: Parameters<typeof clsx>): string {
    return twMerge(clsx(inputs));
  }

  it("should merge two class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle falsy values", () => {
    expect(cn("foo", null, "bar")).toBe("foo bar");
    expect(cn("foo", undefined, "bar")).toBe("foo bar");
    expect(cn("foo", false, "bar")).toBe("foo bar");
  });

  it("should handle empty strings", () => {
    expect(cn("", "bar")).toBe("bar");
  });

  it("should merge tailwind classes correctly", () => {
    expect(cn("px-2 p-4")).toBe("p-4");
    expect(cn("text-red-500 text-blue-500")).toBe("text-blue-500");
  });
});

describe("CSV parsing", () => {
  function parseCsv(content: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < content.length; i++) {
      const c = content[i];
      if (q) {
        if (c === '"') q = false;
        else cur += c;
      } else {
        if (c === '"') q = true;
        else if (c === ",") { row.push(cur); cur = ""; }
        else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
        else if (c === "\r") { /* skip */ }
        else cur += c;
      }
    }
    row.push(cur);
    if (row.some(v => v)) rows.push(row);
    return rows;
  }

  function toCsv(rows: string[][]): string {
    return rows.map(row =>
      row.map(cell => cell.includes(",") ? `"${cell}"` : cell).join(",")
    ).join("\n");
  }

  describe("parseCsv", () => {
    it("should parse simple CSV", () => {
      const input = "a,b,c\nd,e,f";
      expect(parseCsv(input)).toEqual([
        ["a", "b", "c"],
        ["d", "e", "f"],
      ]);
    });

    it("should handle quoted values", () => {
      const input = '"hello,world",foo';
      expect(parseCsv(input)).toEqual([["hello,world", "foo"]]);
    });

    it("should handle empty cells", () => {
      const input = "a,,c";
      expect(parseCsv(input)).toEqual([["a", "", "c"]]);
    });

    it("should handle newlines", () => {
      const input = "a,b\nc,d\ne,f";
      expect(parseCsv(input)).toEqual([
        ["a", "b"],
        ["c", "d"],
        ["e", "f"],
      ]);
    });
  });

  describe("toCsv", () => {
    it("should convert array to CSV", () => {
      const input = [["a", "b"], ["c", "d"]];
      expect(toCsv(input)).toBe("a,b\nc,d");
    });

    it("should handle quotes in values", () => {
      const input = [["hello,world"]];
      expect(toCsv(input)).toBe('"hello,world"');
    });
  });
});