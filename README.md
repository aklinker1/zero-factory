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

#### Many

You can generate multiple objects using `factory.many(...)`. This method will return an array of objects.

```ts
userFactory.many(2, { username: "override" })
// [
//   { usenrame: "override", ... }
//   { usenrame: "override", ... }
// ]
````

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

### Function Defaults

In addition to static values, you can pass a function as a value:

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

---

## Future Features?

May or may not implement these.

- Associations:

  ```ts
  const userIdSequence = createSequence("user-")
  const userFactory = createFactory<User>({
    id: userIdSequence,
    // ...
  })
  const postFactory = createFactory<Post>({
    id: createSequence("post-"),
    userId: userIdSequence,
  })
    .associate<User>("user", (user) => ({
      userId: user.id
    }))

  const user = userFactory(); // { id: "user-0", ... }
  const postFactory.with({ user })(/* optional overrides */) // { id: "post-0", userId: "user-0", ... }
  ```
