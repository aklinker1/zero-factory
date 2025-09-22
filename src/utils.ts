/**
 * Deeply make objects partial, but ignoring arrays.
 */
export type DeepPartial<T> =
  T extends Array<any>
    ? T
    : T extends Record<string, any>
      ? { [key in keyof T]?: DeepPartial<T[key]> }
      : T;

/**
 * Deep merge objects, not arrays. Only override values with `null`, `undefined` does not override the base value.
 */
export function deepMerge<T>(base: T, overrides: DeepPartial<T>): T {
  if (!isMergeable(overrides)) return applyOverride(base, overrides) as T;

  return Object.fromEntries(
    Object.keys({ ...base, ...overrides }).map((key) => [
      key,
      deepMerge((base as any)[key], (overrides as any)[key]),
    ]),
  ) as T;
}

function applyOverride(base: unknown, override: unknown): unknown {
  return override === undefined ? base : override;
}

function isMergeable(val: any): val is Record<string, any> {
  return (
    // Not null
    val != null &&
    // Is an object
    typeof val === "object" &&
    // Not an array
    !Array.isArray(val)
  );
}

export type FactoryDefaults<T extends Record<string, any>> = {
  [Key in keyof T]: T[Key] extends Array<any> | Date
    ? T[Key] | (() => T[Key])
    : T[Key] extends Record<string, any>
      ? FactoryDefaults<T[Key]>
      : T[Key] extends Function
        ? never
        : T[Key] | (() => T[Key]);
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
