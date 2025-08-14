/**
 * A simple function that returns a value based on how many times the function
 * has been called.
 */
export type Sequence<T> = () => T;

/**
 * Defines what sequence values look like.
 */
export type SequenceDefinition<T> = (i: number) => T;

/**
 * Shorthand for creating a sequence of incrementing integers staring at 0.
 *
 * Same as `createSequence((i) => i)`.
 *
 * @example
 * ```ts
 * const seq = createSequence();
 * seq(); // 0
 * seq(); // 1
 * seq(); // 2
 * // ...
 * ```
 */
export function createSequence(): Sequence<number>;
/**
 * Shorthand for creating a sequence of incrementing strings staring at 0.
 *
 * Same as `createSequence((i) => `${prefix}${i})`.
 *
 * @param prefix The string to put in front of the incrementing integer.
 *
 * @example
 * ```ts
 * const seq = createSequence("user-");
 * seq(); // "user-0"
 * seq(); // "user-1"
 * seq(); // "user-2"
 * // ...
 * ```
 */
export function createSequence(prefix: string): Sequence<string>;
/**
 * Use a custom function to generate the sequence values.
 *
 * @param fn Callback called each time the sequence needs to generate a value.
 *           The first argument, `i`, starts at 0.
 *
 * @example
 * ```ts
 * const seq = createSequence((i) => `example-${i * 2}`)
 * seq(); // "example-0"
 * seq(); // "example-2"
 * seq(); // "example-4"
 * // ...
 * ```
 */
export function createSequence<T>(fn: SequenceDefinition<T>): Sequence<T>;
export function createSequence(
  arg?: string | SequenceDefinition<any>,
): Sequence<any> {
  if (!arg) return createSequence((i) => i);
  if (typeof arg === "string") return createSequence((i) => `${arg}${i}`);

  let i = 0;

  return () => arg(i++);
}
