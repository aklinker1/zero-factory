import { describe, it, expect, expectTypeOf } from "bun:test";
import { type Factory, createFactory } from "../factories";
import type { DeepPartial } from "../utils";
import { createSequence } from "../sequences";

describe("Factory APIs", () => {
  type User = {
    id: number;
    username: string;
  };

  describe("Factory", () => {
    describe("when traits are not defined in the second type parameter", () => {
      it("should be just a function", () => {
        type Actual = Factory<User>;

        expectTypeOf<Actual>().parameters.toEqualTypeOf<
          [overrides?: DeepPartial<User>]
        >();
        expectTypeOf<Actual>().returns.toEqualTypeOf<User>();
      });
    });

    describe("when traits are defined in the second type parameter", () => {
      it("should return a function intersected with a record of functions", () => {
        type Expected = (overrides?: DeepPartial<User>) => User;

        type Actual = Factory<User, "trait1" | "trait2">;

        expectTypeOf<Actual>().parameters.toEqualTypeOf<
          [overrides?: DeepPartial<User>]
        >();
        expectTypeOf<Actual>().returns.toEqualTypeOf<User>();
        expectTypeOf<Actual["trait1"]>().toEqualTypeOf<Expected>();
        expectTypeOf<Actual["trait2"]>().toEqualTypeOf<Expected>();
      });
    });
  });

  describe("createFactory", () => {
    describe("when the default values are just values", () => {
      it("should return the values as-is", () => {
        const id = 1;
        const username = "username";

        const expected: User = { id, username };

        const factory = createFactory<User>({ id, username });

        expect(factory()).toEqual(expected);
        expect(factory()).toEqual(expected);
      });
    });

    describe("when the default values are functions", () => {
      it("should call the functions to resolve the values", () => {
        const idSequence = createSequence();
        const usernameSequence = createSequence("username-");
        const expected0: User = { id: 0, username: "username-0" };
        const expected1: User = { id: 1, username: "username-1" };

        const factory = createFactory<User>({
          id: idSequence,
          username: usernameSequence,
        });

        expect(factory()).toEqual(expected0);
        expect(factory()).toEqual(expected1);
      });
    });

    describe("traits", () => {
      const DEFAULT_ID = 0;
      const DEFAULT_USERNAME = "default";
      const TRAIT_USERNAME = "trait";

      const factory = createFactory<User>({
        id: DEFAULT_ID,
        username: DEFAULT_USERNAME,
      }).trait("test", { username: TRAIT_USERNAME });

      it("should still support using the default function", () => {
        const expected: User = {
          id: DEFAULT_ID,
          username: DEFAULT_USERNAME,
        };

        const actual = factory();

        expect(actual).toEqual(expected);
      });

      it("should apply trait values over the default values", () => {
        const expected: User = {
          id: DEFAULT_ID,
          username: TRAIT_USERNAME,
        };

        const actual = factory.test();

        expect(actual).toEqual(expected);
      });

      it("should override trait values with override arguments", () => {
        const OVERRIDE_USERNAME = "override";
        const expected: User = {
          id: DEFAULT_ID,
          username: OVERRIDE_USERNAME,
        };

        const actual = factory.test({ username: OVERRIDE_USERNAME });

        expect(actual).toEqual(expected);
      });
    });
  });
});
