import { describe, expect, it } from "bun:test";
import { createFactory } from "../factories";
import { createSequence } from "../sequences";

describe("Factory APIs", () => {
  type User = {
    id: number;
    username: string;
  };

  describe("Factory", () => {
    describe("enumerated values", () => {
      it("should allow a function that returns a boolean for a boolean property", () => {
        type TestObject = { bool: boolean };
        const randBoolean = (): boolean => Math.random() > 0.5;

        createFactory<TestObject>({ bool: randBoolean }); // Expect no type error here
      });

      it("should allow a function that returns an enum for an enum property", () => {
        enum TestEnum {
          A,
          B,
          C,
        }
        type TestObject = { value: TestEnum };
        const randTestEnum = (): TestEnum =>
          [TestEnum.A, TestEnum.B, TestEnum.C][Math.floor(Math.random() * 3)]!;

        createFactory<TestObject>({ value: randTestEnum }); // Expect no type error here
      });

      it("should allow a function that returns a Date for a Date property", () => {
        type TestObject = { date: Date };
        const randDate = () => new Date();

        createFactory<TestObject>({ date: randDate }); // Expect no type error here
      });

      it("should allow a function that returns an object for an object property", () => {
        type TestObject = { nested: { a: string; b: number } };
        const randNested = (): { a: string; b: number } => ({
          a: "hello",
          b: 42,
        });

        createFactory<TestObject>({ nested: randNested }); // Expect no type error here
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

      it("should call a function that returns an object to resolve the value", () => {
        type TestObject = { nested: { value: number } };
        let counter = 0;
        const factory = createFactory<TestObject>({
          nested: () => ({ value: counter++ }),
        });

        expect(factory()).toEqual({ nested: { value: 0 } });
        expect(factory()).toEqual({ nested: { value: 1 } });
      });

      it("should allow overriding properties of an object returned by a function", () => {
        type TestObject = { nested: { a: string; b: number } };
        const factory = createFactory<TestObject>({
          nested: () => ({ a: "default", b: 0 }),
        });

        expect(factory({ nested: { a: "override" } })).toEqual({
          nested: { a: "override", b: 0 },
        });
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

    describe(".many()", () => {
      it("should generate many objects", () => {
        const factory = createFactory<User>({
          id: createSequence(),
          username: "default",
        });
        const actual = factory.many(3);
        expect(actual).toEqual([
          { id: 0, username: "default" },
          { id: 1, username: "default" },
          { id: 2, username: "default" },
        ]);
      });

      it("should generate many objects with overrides", () => {
        const factory = createFactory<User>({
          id: createSequence(),
          username: "default",
        });
        const actual = factory.many(2, { username: "override" });
        expect(actual).toEqual([
          { id: 0, username: "override" },
          { id: 1, username: "override" },
        ]);
      });

      it("should generate many objects from a trait", () => {
        const factory = createFactory<User>({
          id: createSequence(),
          username: "default",
        }).trait("test", { username: "trait" });

        const actual = factory.test.many(2);
        expect(actual).toEqual([
          { id: 0, username: "trait" },
          { id: 1, username: "trait" },
        ]);
      });

      it("should generate many objects from a trait with overrides", () => {
        const factory = createFactory<User>({
          id: createSequence(),
          username: "default",
        }).trait("test", { username: "trait" });
        const actual = factory.test.many(2, { username: "override" });
        expect(actual).toEqual([
          { id: 0, username: "override" },
          { id: 1, username: "override" },
        ]);
      });
    });

    describe("associations", () => {
      type Post = { id: number; userId: number };

      it("should apply associated overrides", () => {
        const userIdSequence = createSequence();
        const userFactory = createFactory<User>({
          id: userIdSequence,
          username: "default",
        });
        const postFactory = createFactory<Post>({
          id: createSequence(),
          userId: userIdSequence,
        }).associate("user", (user: User) => ({
          userId: user.id,
        }));

        const user = userFactory();
        const actual = postFactory.with({ user })();
        expect(actual).toEqual({
          id: 0,
          userId: user.id,
        });
      });
    });
  });
});
