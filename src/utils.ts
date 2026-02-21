/**
 * Deeply make objects partial, but ignoring arrays.
 */
export type DeepPartial<T> = T extends any[] | Date
  ? T
  : T extends Record<string, any>
    ? { [key in keyof T]?: DeepPartial<T[key]> }
    : T;

/**
 * Deep merge objects, not arrays. Only override values with `null`, `undefined` does not override the base value.
 */
export function deepMerge<T>(base: T, overrides: DeepPartial<T>): T {
  if (!isMergeable(overrides)) return (overrides ?? base) as T;

  return Object.fromEntries(
    Object.keys({ ...base, ...overrides })
      .map((key) => {
        const baseValue = (base as any)[key];
        if (!(key in overrides)) return [key, baseValue];

        const overrideValue = (overrides as any)[key];
        if (isMergeable(overrideValue))
          return [key, deepMerge(baseValue, overrideValue)];

        return [key, overrideValue];
      })
      .filter((entry) => entry != null),
  ) as T;
}

function isMergeable(val: any): val is Record<string, any> {
  return (
    // Not null
    val != null &&
    // Is an object
    typeof val === "object" &&
    // Not an array
    !Array.isArray(val) &&
    // Not a date instance
    !(val instanceof Date)
  );
}

/**
 * List of types used by {@link FactoryDefaults} to "stop" the recursion and
 * return `T | (() => T)` for. Runtime checks for this list happen in
 * {@link isMergeable}.
 */
export type NonMergeableValue =
  // Don't allow factory functions in arrays
  | any[]
  // Allow factory functions for this class
  | Date
  // Primitives
  | string
  | boolean
  | number
  | null
  | undefined;

/**
 * Helper type to extract the non-null, non-undefined parts of a type.
 */
type NonNullableCore<T> = Exclude<T, null | undefined>;

/**
 * Maps a value type `T` to its allowed factory default type.
 *
 * This uses a two-step approach:
 * 1. If the core type (without null/undefined) is a NonMergeableValue, keep the
 *    whole union intact and allow `() => T` where T includes null/undefined.
 *    This preserves `() => string | undefined` instead of splitting it.
 * 2. If the core type is an object, expand it recursively and handle null/undefined
 *    separately to support `{ a: string } | null | undefined` properly.
 */
type FactoryDefaultValue<T> =
  NonNullableCore<T> extends NonMergeableValue
    ? T | (() => T)
    : NonNullableCore<T> extends Record<string, any>
      ?
          | FactoryDefaults<NonNullableCore<T>>
          | (() => NonNullableCore<T>)
          | (null extends T ? null | (() => null) : never)
          | (undefined extends T ? undefined | (() => undefined) : never)
      : T | (() => T);

export type FactoryDefaults<T extends Record<string, any>> = {
  [Key in keyof T]: FactoryDefaultValue<T[Key]>;
};

export function resolveDefaults<T extends Record<string, any>>(
  val: FactoryDefaults<T>,
): T {
  const result: T = {} as T;

  for (const key in val) {
    if (Object.prototype.hasOwnProperty.call(val, key)) {
      const defaultValue = val[key];

      if (typeof defaultValue === "function") {
        // If the default value is a function, call it to get the actual value.
        (result as any)[key] = (defaultValue as () => any)();
      } else if (isMergeable(defaultValue)) {
        // If the default value is a mergeable object (not an array, Date, etc.),
        // recursively resolve its nested defaults.
        (result as any)[key] = resolveDefaults(
          defaultValue as FactoryDefaults<Record<string, any>>,
        );
      } else {
        // Otherwise (primitive, null, array, Date, RegExp, Promise), use the value directly.
        (result as any)[key] = defaultValue;
      }
    }
  }

  return result;
}
