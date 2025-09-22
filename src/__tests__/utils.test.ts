import { describe, it, expect, expectTypeOf } from "bun:test";
import { deepMerge, type DeepPartial } from "../utils";

describe("Utilities", () => {
  describe("DeepPartial", () => {
    it("should make object properties partial at any level", () => {
      type Input = {
        a: string;
        b?: boolean;
        c: {
          d: number | null;
        };
        e: Date;
      };
      type Expected = {
        a?: string;
        b?: boolean;
        c?: {
          d?: number | null;
        };
        e?: Date;
      };

      type Actual = DeepPartial<Input>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should stop making object properties partial when inside an array", () => {
      type Input = {
        a: string;
        b: string[];
        c: Array<{
          d: number | null;
        }>;
      };
      type Expected = {
        a?: string;
        b?: string[];
        c?: Array<{
          d: number | null;
        }>;
      };

      type Actual = DeepPartial<Input>;

      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });
  });

  describe("deepMerge", () => {
    it("should deeply merge object properties", () => {
      const base = {
        a: "a",
        b: "b",
        c: {
          d: "d",
        },
      };
      const overrides: DeepPartial<typeof base> = {
        a: "z",
        c: {
          d: "z",
        },
      };
      const expected: typeof base = {
        a: "z",
        b: "b",
        c: {
          d: "z",
        },
      };

      const actual = deepMerge(base, overrides);

      expect(actual).toEqual(expected);
    });

    it("should not merge arrays, but overwrite them", () => {
      const base = {
        a: "a",
        b: "b",
        c: [
          {
            d: "d",
          },
          {
            e: "e",
          },
        ],
      };
      const overrides: DeepPartial<typeof base> = {
        a: "z",
        c: [
          {
            d: "z",
          },
        ],
      };
      const expected: typeof base = {
        a: "z",
        b: "b",
        c: [
          {
            d: "z",
          },
        ],
      };

      const actual = deepMerge(base, overrides);

      expect(actual).toEqual(expected);
    });
  });
});
