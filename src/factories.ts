import {
  deepMerge,
  resolveDefaults,
  type DeepPartial,
  type FactoryDefaults,
} from "./utils";

// prettier-ignore
/**
 * A factory is a:
 * - Function that, when called, returns a new object as defined by the default values.
 * - Object containing any `.traitName(...)` functions that, when called, return a new object applying the trait's defaults over the factory's base defaults.
 * - Object containing immutable modifier functions (`trait`) that, when called, returns a new factory with more ways of generating objects.
 */
export type Factory<
  TObject extends Record<string, any>,
  TTraits extends string | undefined = undefined,
> =
    FactoryFn<TObject>
  & TraitFactoryFns<TObject, TTraits extends string ? TTraits : never>
  & FactoryModifiers<TObject, TTraits>;

/**
 * Function that takes in overrides and returns a new object.
 */
export type FactoryFn<TObject> = {
  (overrides?: DeepPartial<TObject>): TObject;
  /**
   * Generate multiple items.
   *
   * @example
   * ```ts
   * userFactory.many(4, { username: "override" });
   * // [
   * //   { id: "user-0", username: "override", ... },
   * //   { id: "user-1", username: "override", ... },
   * //   { id: "user-2", username: "override", ... },
   * //   { id: "user-3", username: "override", ... },
   * // ]
   * ```
   */
  many(count: number, overrides?: DeepPartial<TObject>): TObject[];
};

/**
 * Map of factory functions for traits.
 */
export type TraitFactoryFns<TObject, TTraits extends string> = {
  [name in TTraits]: FactoryFn<TObject>;
};

/**
 * Functions that modify the factory's type.
 */
export type FactoryModifiers<
  TObject extends Record<string, any>,
  TTraits extends string | undefined,
> = {
  /**
   * Add a trait or variant to the factory, allowing developers to create the
   * object with multiple sets of default values.
   *
   * @example
   * ```ts
   * const userFactory = createFactory<User>({
   *   // ...
   *   subscribedToEmails: true,
   * })
   *   .trait("unsubscribed", { subscribedToEmails: false })
   *
   * userFactory() // { subscribedToEmails: true }
   * userFactory.unsubscribed() // { subscribedToEmails: false }
   * ```
   *
   * @param name The name of the trait to add
   * @param traitDefaults Default values to apply over the factory's base
   *                      default values. These can still be overridden when
   *                      calling the factory function.
   */
  trait<T2 extends string>(
    name: T2,
    traitDefaults: DeepPartial<FactoryDefaults<TObject>>,
  ): Factory<TObject, AddTrait<TTraits, T2>>;
};

// prettier-ignore
export type AddTrait<
  T1 extends string | undefined,
  T2 extends string,
> = T1 extends string
  ? T1 | T2
  : T2;

/**
 * Create a function that returns objects of the specified type.
 * @param defaults The default values for the returned object. Each property can be a value or function that return a value.
 */
export function createFactory<T extends Record<string, any>>(
  defaults: FactoryDefaults<T>,
): Factory<T> {
  return createFactoryInternal(defaults, {});
}

function createFactoryInternal<T extends Record<string, any>>(
  defaults: FactoryDefaults<T>,
  traits: Record<string, FactoryDefaults<T>>,
): Factory<T, any> {
  return Object.assign(
    // Base factory function
    (overrides?: any): any => generateObject(defaults, overrides),

    {
      many: (count: number, overrides?: any): T[] =>
        generateManyObjects(count, defaults, overrides),

      // Modifier functions

      trait: (
        name: string,
        traitDefaults: DeepPartial<FactoryDefaults<T>>,
      ): Factory<T, any> =>
        createFactoryInternal(defaults, {
          ...traits,
          [name]: deepMerge<FactoryDefaults<T>>(defaults, traitDefaults),
        }),

      // Generate Trait functions

      ...Object.fromEntries<any>(
        Object.entries(traits).map<any>(([name, traitDefaults]) => {
          const traitFactory = (overrides?: any): any =>
            generateObject(traitDefaults, overrides);

          traitFactory.many = (count: number, overrides?: any): T[] =>
            generateManyObjects(count, traitDefaults, overrides);

          return [name, traitFactory];
        }),
      ),
    },
  ) as any;
}

function generateObject<T extends Record<string, any>>(
  defaults: FactoryDefaults<T>,
  overrides: DeepPartial<T>,
): T {
  const resolvedDefaults: T = resolveDefaults<T>(defaults);
  return deepMerge<T>(resolvedDefaults, overrides);
}

function generateManyObjects<T extends Record<string, any>>(
  count: number,
  defaults: FactoryDefaults<T>,
  overrides: DeepPartial<T>,
): T[] {
  return Array.from({ length: count }, () =>
    generateObject(defaults, overrides),
  );
}
