<div align="center">

# @aklinker1/zero-factory

[![JSR](https://jsr.io/badges/@aklinker1/zero-factory)](https://jsr.io/@aklinker1/zero-factory) [![NPM Version](https://img.shields.io/npm/v/%40aklinker1%2Fzero-factory?logo=npm&labelColor=red&color=white)](https://www.npmjs.com/package/@aklinker1/zero-factory) [![Docs](https://img.shields.io/badge/Docs-blue?logo=readme&logoColor=white)](https://jsr.io/@aklinker1/zero-factory) [![API Reference](https://img.shields.io/badge/API%20Reference-blue?logo=readme&logoColor=white)](https://jsr.io/@aklinker1/zero-factory/doc) [![License](https://img.shields.io/npm/l/%40aklinker1%2Fzero-factory)](https://github.com/aklinker1/zero-factory/blob/main/LICENSE)

Zero dependency object factory generator for testing.

</div>

```ts
import { createFactory, createSequence } from "@aklinker1/zero-factory";

const userFactory = createFactory<User>({
  id: createSequence("user-"),
  username: "example-username",
  email: () => "example-email-" + Math.random(),
});

userFactory({ id: "test", username: "user" });
// => {
//   id: "test",
//   username: "user",
//   email: "example-email-0.20088082049103195"
// }
```

```sh
npm i @aklinker1/zero-factory
```

**Features:**

- ✅ Type-safe
- ✨ Deeply merge overrides with default values
- 🔢 Sequence generator for IDs
- 🎨 "traits" - define multiple variants of default values
- ⚡ Compatible with all fake data generators (`@ngneat/falso`, `faker-js`, `chance`, `casual`, etc)

**Not Supported:**

- **Class instances**: Only objects can be created. Factories will not create class instances.

## Usage

### Factories

Use `createFactory` to build an object factory. Object factories are simple functions that return an object:

```ts
const userFactory = createFactory<User>({
  id: "user-id",
  username: "username",
  email: "example@gmail.com",
  preferences: {
    receiveMarketingEmails: true,
    receiveSecurityEmails: true,
  },
});
// typeof userFactory = (overrides?: DeepPartial<User>) => User
```

Then, to get an object conforming to the `User` type, just call the factory as a function:

```ts
const user = userFactory();
// => {
//   id: "user-id",
//   username: "username",
//   email: "example@gmail.com",
//   preferences: {
//     receiveMarketingEmails: true,
//     receiveSecurityEmails: true,
//   }
// }
```

You can also override specific properties at any level:

```ts
const user = userFactory({
  username: "overridden",
  preferences: {
    receiveMarketingEmails: false,
  },
});
// => {
//   id: "user-id",
//   username: "overridden",
//   email: "example@gmail.com",
//   preferences: {
//     receiveMarketingEmails: false,
//     receiveSecurityEmails: true,
//   }
// }
```

> [!IMPORTANT]
> Arrays are not deeply merged. If a property is an array, overrides will fully replace it, like any other value.

#### Function Defaults

In addition to static values, the factory definition accepts functions for properties:

```ts
const userFactory = createFactory({
  email: () => `example.${Math.floor(Math.random() * 1000)}@gmail.com`,
  // ...
});
```

Every time the factory is called, this will call the function and, in this case, generate a different `email` each time:

```ts
userFactory(); // { email: "example.424@gmail.com", ... }
userFactory(); // { email: "example.133@gmail.com", ... }
```

This is where [fake data generators](https://www.npmjs.com/search?q=fake%20data) and [sequences](#sequences) come in clutch:

```ts
import { createFactory, createSequence } from "@aklinker1/zero-factory";
import {
  randEmail, // () => string
  randUsername, // () => string
  randBoolean, // () => boolean
} from "@ngneat/falso";

const userFactory = createFactory({
  id: createSequence("user-"),
  username: randUsername,
  email: randEmail,
  preferences: {
    receiveMarketingEmails: randBoolean,
    receiveSecurityEmails: randBoolean,
  },
});
```

#### Many

You can generate multiple objects using `factory.many(...)`. This method will return an array of objects.

```ts
userFactory.many(2, { username: "override" });
// [
//   { usenrame: "override", ... }
//   { usenrame: "override", ... }
// ]
```

Overridden fields apply to all the returned objects.

#### Traits

If there are common variants or "traits" of an object you want to be able to generate, use `factory.trait(...)`:

```ts
const userFactory = createFactory({
  // same as above
}).trait("noEmails", {
  preferences: {
    receiveMarketingEmails: false,
    receiveSecurityEmails: false,
  },
});
```

Then, to generate an object using this trait, the trait is a function defined on the object factory:

```ts
const user = userFactory.noEmails();
// => {
//   id: "user-id",
//   username: "username",
//   email: "example@gmail.com",
//   preferences: {
//     receiveMarketingEmails: false,
//     receiveSecurityEmails: false,
//   }
// }
```

When using a trait and overriding specific properties, the trait's default values are applied before the overrides:

```ts
const user = userFactory.noEmails({ username: "overridden" });
// => {
//   id: "user-id",
//   username: "overridden",
//   email: "example@gmail.com",
//   preferences: {
//     receiveMarketingEmails: false,
//     receiveSecurityEmails: false,
//   }
// }
```

#### Associations

If you want to override one or more fields based on a single value, use associations:

```ts
const postFactory = createFactory<Post>({
  id: createSequence(),
  userId: userIdSequence,
  // ...
}).associate("user", (user: User) => ({ userId: user.id }));
```

Then to generate a post associated with a user, use `with`:

```ts
user;
// => {
//   id: 3,
//   ...
// }

postFactory.with({ user })();
// => {
//   id: 0,
//   userId: 3,
//   ...
// }
```

Note that `with` returns a factory function, which needs to be called to generate the final object. This allows you to chain other utilities like `.many` and/or traits:

```ts
postFactory.with({ user }).noEmails.many(3);
```

### Sequences

For values like IDs, it can be useful to generate them incrementally instead of using randomized values. Use the `createSequence` function to do this:

```ts
const userIdSequence = createSequence((i) => `user-${i}`);

userIdSequence(); // "user-0"
userIdSequence(); // "user-1"
userIdSequence(); // "user-2"
// ...
```

The argument `i` is a number starting at 0 that gets incremented by 1 each time the sequence is called. The return value can be anything (string, boolean, object, integer, etc).

```ts
const intSequence = createSequence((i) => i + 1);
intSequence(); // 1
intSequence(); // 2
intSequence(); // 3
// ...

const boolSequence = createSequence((i) => i % 2 === 0);
boolSequence(); // true
boolSequence(); // false
boolSequence(); // true
// ...
```

However, the most common types of return values are integers and strings. For both, there is a shorthand:

```ts
const intSequence = createSequence();
intSequence(); // 0
intSequence(); // 1
intSequence(); // 2
// ...

const strSequence = createSequence("prefix-");
intSequence(); // "prefix-0"
intSequence(); // "prefix-1"
intSequence(); // "prefix-2"
```
