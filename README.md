<h1 align="center">`@aklinker1/zero-factory`</h1>

<p align="center">Zero dependency object factory generator for testing.</p>

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
//   email: "example-email"
// }
```

```sh
npm i @aklinker1/zero-factory
```

**Features:**

- Type-safe
- Deeply merge overrides with default values
- Sequence generator for IDs
- "traits" - define multiple variants of default values

**Not Supported:**

- **Class instances**: Only objects can be created. Factories will not create class instances.
- **Randomized data**: There are a handful of very useful libraries for generating rand values for testing (`faker-js`, `chance`, `@ngneat/falso`, `casual`, etc).

## Usage

### Factories

Use `createFactory` to build an object factory. Object factories are simple functions that accept overrides and returns an object containing the default values and overrides.

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
const user1 = userFactory();
// => {
//   id: "user-id",
//   username: "username",
//   email: "example@gmail.com",
//   preferences: {
//     receiveMarketingEmails: true,
//     receiveSecurityEmails: true,
//   }
// }

const user2 = userFactory({
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
const user1 = userFactory.noEmails();
// => {
//   id: "user-id",
//   username: "username",
//   email: "example@gmail.com",
//   preferences: {
//     receiveMarketingEmails: false,
//     receiveSecurityEmails: false,
//   }
// }

const user2 = userFactory.noEmails({ username: "overridden" });
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

For things like IDs, it can be useful to generate them incrementally each time the factory is called. Use the `createSequence` function to do this:

```ts
const userIdSequence = createSequence((i) => `user-${i}`);

userIdSequence(); // "user-0"
userIdSequence(); // "user-1"
userIdSequence(); // "user-2"
// ...
```

The function used to define the sequence includes a single parameter, a number starting at 0 that gets incremented each time the sequence is called. The return value can be anything (string, boolean, object, integer, etc).

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

May or may not implement these

- Generate multiple items:
  ```ts
  userFactory.many(4, { username: "override" });
  // [
  //   { id: "user-0", username: "override", ... },
  //   { id: "user-1", username: "override", ... },
  //   { id: "user-2", username: "override", ... },
  //   { id: "user-3", username: "override", ... },
  // ]
  ```
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
    .associate("user", (user) => ({
      userId: user.id
    }))

  const user = userFactory(); // { id: "user-0", ... }
  const postFactory.with({ user })(/* optional overrides */) // { id: "post-0", userId: "user-0", ... }
  ```
