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
  TAssociations extends Record<string, any> = {}
> =
    FactoryFn<TObject, TAssociations>
  & TraitFactoryFns<TObject, TTraits extends string ? TTraits : never, TAssociations>
  & FactoryModifiers<TObject, TTraits>;

/**
 * Function that takes in overrides and returns a new object.
 */
export type FactoryFn<
  TObject,
  TAssociations extends Record<string, any> = {},
> = {
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

  /**
   * Apply associations and return a new factory function.
   *
   * @see {@link FactoryModifiers#associate}
   */
  with(associations: Partial<TAssociations>): FactoryFn<TObject, {}>;
};

/**
 * Map of factory functions for traits.
 */
export type TraitFactoryFns<
  TObject,
  TTraits extends string,
  TAssociations extends Record<string, any> = {},
> = {
  [name in TTraits]: FactoryFn<TObject, TAssociations>;
};

/**
 * Functions that modify the factory's type.
 */
export type FactoryModifiers<
  TObject extends Record<string, any>,
  TTraits extends string | undefined,
  TAssociations extends Record<string, any> = {},
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

  /**
   * Returns a factory that uses associations to apply default values.
   *
   * There are two common use-cases:
   * - Generating "dependent" properties
   * - Database relationships
   *
   * @example
   * ```ts
   * const userFactory = createFactory<User>({
   *   id: createSequence("user-"),
   *   email: randEmail(),
   *   fullName: randFullName(),
   *   firstName: randFirstName(),
   *   lastName: randLastName(),
   * })
   *   .associate("fullName", (fullName: string) => ({
   *     fullName,
   *     firstName: fullName.split(" ")[0],
   *     lastName: fullName.split(" ")[1],
   *   })
   *
   * userFactory.with({ fullName: "John Doe" })()
   * // {
   * //   id: "user-0",
   * //   email: "john.doe@example.com",
   * //   fullName: "John Doe",
   * //   firstName: "John",
   * //   lastName: "Doe",
   * // }
   * ```
   *
   * @example
   * ```ts
   * const postFactory = createFactory<Post>({
   *   id: createSequence("post-"),
   *   userId: createSequence("user-"),
   *   // ...
   * })
   *   .associate("user", (user: User) => ({
   *     userId: user.id,
   *   })
   *
   * const user = userFactory();
   * // {
   * //   id: "user-0",
   * //   ...
   * // }
   * const post = postFactory.with({ user })()
   * // {
   * //   id: "post-0",
   * //   userId: "user-0",
   * //   // ...
   * // }
   * ```
   */
  associate<TKey extends string, TValue>(
    key: TKey,
    apply: (value: TValue) => DeepPartial<TObject>,
  ): Factory<TObject, TTraits, AddAssociation<TAssociations, TKey, TValue>>;
};

// prettier-ignore
export type AddTrait<
  T1 extends string | undefined,
  T2 extends string,
> = T1 extends string
  ? T1 | T2
  : T2;

export type AddAssociation<
  TAssociations extends Record<string, any>,
  TKey extends string,
  TValue,
> = {
  [key in keyof TAssociations | TKey]: key extends TKey
    ? TValue
    : TAssociations[key];
};

/**
 * Create a function that returns objects of the specified type.
 * @param defaults The default values for the returned object. Each property can be a value or function that return a value.
 */
export function createFactory<T extends Record<string, any>>(
  defaults: FactoryDefaults<T>,
): Factory<T> {
  return createFactoryInternal(defaults, {
    traits: {},
    associations: {},
  });
}

function createFactoryInternal<T extends Record<string, any>>(
  defaults: FactoryDefaults<T>,
  state: {
    traits: Record<string, FactoryDefaults<T>>;
    associations: Record<string, (value: any) => DeepPartial<T>>;
  },
): Factory<T, any> {
  const createFactoryFn = (
    factoryDefaults: FactoryDefaults<T>,
  ): FactoryFn<T> => {
    const factoryFn = (overrides?: any): any =>
      generateObject(factoryDefaults, overrides);

    factoryFn.many = (count: number, overrides?: any): T[] =>
      generateManyObjects(count, factoryDefaults, overrides);

    factoryFn.with = (associations: Record<string, any>) => {
      const combinedDefaults = Object.entries(associations).reduce(
        (acc, [key, value]) => {
          if (state.associations[key]) {
            const override = state.associations[key](value);
            return deepMerge<any>(acc, override);
          } else {
            return acc;
          }
        },
        defaults,
      );

      return createFactoryInternal(combinedDefaults, state);
    };

    return factoryFn as FactoryFn<T>;
  };

  return Object.assign(
    // Base factory function
    createFactoryFn(defaults),

    {
      // Modifier functions

      trait: (
        name: string,
        traitDefaults: DeepPartial<FactoryDefaults<T>>,
      ): Factory<T, any> =>
        createFactoryInternal(defaults, {
          ...state,
          traits: {
            ...state.traits,
            [name]: deepMerge<FactoryDefaults<T>>(defaults, traitDefaults),
          },
        }),

      associate: (key: string, apply: (value: any) => any) => {
        return createFactoryInternal(defaults, {
          ...state,
          associations: {
            ...state.associations,
            [key]: apply,
          },
        });
      },

      // Generate Trait functions

      ...Object.fromEntries<any>(
        Object.entries(state.traits).map<any>(([name, traitDefaults]) => [
          name,
          createFactoryFn(traitDefaults),
        ]),
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
