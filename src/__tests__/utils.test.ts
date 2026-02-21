import { describe, expect, expectTypeOf, it } from "bun:test";
import { deepMerge, type DeepPartial, type FactoryDefaults } from "../utils";

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

    describe.each([undefined, null, "", 0, Symbol(), false])(
      "When %p is used to override a value",
      (override) => {
        it("should override primitives", () => {
          const base = {
            a: "a" as any,
            b: "b",
          };
          const expected = {
            a: override,
            b: "b",
          };
          const actual = deepMerge(base, { a: override });

          expect(actual).toEqual(expected);
        });

        it("should override objects", () => {
          const base = {
            a: { a: "a" } as any,
            b: "b",
          };
          const expected = {
            a: override,
            b: "b",
          };
          const actual = deepMerge(base, { a: override });

          expect(actual).toEqual(expected);
        });

        it("should override arrays", () => {
          const base = {
            a: [{ a: "a" }] as any,
            b: "b",
          };
          const expected = {
            a: override,
            b: "b",
          };
          const actual = deepMerge(base, { a: override });

          expect(actual).toEqual(expected);
        });
      },
    );
  });

  describe("FactoryDefault", () => {
    it('should accept a "boolean" or "() => boolean"', () => {
      type Input = { a: boolean };
      type Expected = { a: boolean | (() => boolean) };
      type Actual = FactoryDefaults<Input>;
      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it('should accept a "string" or "() => string"', () => {
      type Input = { a: string };
      type Expected = { a: string | (() => string) };
      type Actual = FactoryDefaults<Input>;
      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it('should accept a "number" or "() => number"', () => {
      type Input = { a: number };
      type Expected = { a: number | (() => number) };
      type Actual = FactoryDefaults<Input>;
      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it('should accept a "Branded" or "() => Branded"', () => {
      type Branded = number & { __brand: "date" };
      type Input = { a: Branded };
      type Expected = { a: Branded | (() => Branded) };
      type Actual = FactoryDefaults<Input>;
      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should optionally accept optional keys", () => {
      type Input = { a?: string };
      type Expected = { a?: string | (() => string | undefined) };
      type Actual = FactoryDefaults<Input>;
      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should require undefinable keys", () => {
      type Input = { a: string | undefined };
      type Expected = { a: string | undefined | (() => string | undefined) };
      type Actual = FactoryDefaults<Input>;
      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should require nullable keys", () => {
      type Input = { a: string | null };
      type Expected = { a: string | null | (() => string | null) };
      type Actual = FactoryDefaults<Input>;
      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should handle literal union types", () => {
      type Input = { a: 2 | 3 };
      type Expected = { a: 2 | 3 | (() => 2 | 3) };
      type Actual = FactoryDefaults<Input>;
      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should deeply expand object keys", () => {
      type Input = { a: { b: boolean } };
      type Expected = {
        a: { b: boolean | (() => boolean) } | (() => { b: boolean });
      };
      type Actual = FactoryDefaults<Input>;
      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should handle an object | undefined property", () => {
      type Input = { a: { b: string } | undefined };
      type Expected = {
        a:
          | { b: string | (() => string) }
          | (() => { b: string })
          | undefined
          | (() => undefined);
      };
      type Actual = FactoryDefaults<Input>;
      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should handle an object | null property", () => {
      type Input = { a: { b: string } | null };
      type Expected = {
        a:
          | { b: string | (() => string) }
          | (() => { b: string })
          | null
          | (() => null);
      };
      type Actual = FactoryDefaults<Input>;
      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it('should accept a "() => object" for an object property', () => {
      type Input = { a: { b: string; c: number } };
      type Expected = {
        a:
          | { b: string | (() => string); c: number | (() => number) }
          | (() => { b: string; c: number });
      };
      type Actual = FactoryDefaults<Input>;
      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });

    it("should not deeply expand array keys", () => {
      type Input = { a: Array<{ b: boolean }> };
      type Expected = {
        a: Array<{ b: boolean }> | (() => Array<{ b: boolean }>);
      };
      type Actual = FactoryDefaults<Input>;
      expectTypeOf<Actual>().toEqualTypeOf<Expected>();
    });
  });
});
