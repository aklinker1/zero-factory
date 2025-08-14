import { describe, it, expect } from "bun:test";
import { createSequence } from "../sequences";

describe("Sequence APIs", () => {
  describe("createSequence", () => {
    describe("when no arguments are passed", () => {
      it("should return an integer sequence starting at 0", () => {
        const seq = createSequence();

        expect(seq()).toEqual(0);
        expect(seq()).toEqual(1);
        expect(seq()).toEqual(2);
      });
    });

    describe("when a prefix is passed", () => {
      it("should apply a prefix before the incrementing integer starting at 0", () => {
        const seq = createSequence("user-");

        expect(seq()).toEqual("user-0");
        expect(seq()).toEqual("user-1");
        expect(seq()).toEqual("user-2");
      });
    });

    describe("when a function is passed", () => {
      it("should return the functions return value starting at 0", () => {
        const seq = createSequence((i) => ({ i }));

        expect(seq()).toEqual({ i: 0 });
        expect(seq()).toEqual({ i: 1 });
        expect(seq()).toEqual({ i: 2 });
      });
    });
  });
});
