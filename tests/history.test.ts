import { describe, expect, it } from "vitest";
import { parseHistory } from "@/lib/history";

describe("parseHistory", () => {
  it("returns an empty array for missing or invalid storage values", () => {
    expect(parseHistory(null)).toEqual([]);
    expect(parseHistory("{")).toEqual([]);
    expect(parseHistory("{}")).toEqual([]);
    expect(parseHistory('"abc"')).toEqual([]);
    expect(parseHistory("123")).toEqual([]);
  });

  it("keeps valid history records", () => {
    const raw = JSON.stringify([
      {
        input: "帮我写项目计划书",
        createdAt: "2026-07-09T10:00:00.000Z",
      },
    ]);

    expect(parseHistory(raw)).toEqual([
      {
        input: "帮我写项目计划书",
        createdAt: "2026-07-09T10:00:00.000Z",
      },
    ]);
  });

  it("filters invalid items without dropping valid records", () => {
    const raw = JSON.stringify([
      {
        input: "合法记录",
        createdAt: "2026-07-09T10:00:00.000Z",
      },
      {},
      {
        input: 123,
        createdAt: "abc",
      },
      {
        input: "   ",
        createdAt: "2026-07-09T10:00:00.000Z",
      },
    ]);

    expect(parseHistory(raw)).toEqual([
      {
        input: "合法记录",
        createdAt: "2026-07-09T10:00:00.000Z",
      },
    ]);
  });
});
