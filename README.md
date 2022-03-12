# anchor-client-gen

Generate typescript solana web3 clients from [anchor](https://github.com/project-serum/anchor) IDLs.

## Installation

```sh
# npm
$ npm install --global anchor-client-gen

# yarn
$ yarn add global anchor-client-gen
```

## Usage

```sh
Usage: main [options] <idl> <out>

Generate solana web3 client code from the specified anchor IDL.

Arguments:
  idl                        anchor IDL file path
  out                        output directory

Options:
  --program-id <PROGRAM_ID>  optional program ID to be included in the code
  -h, --help                 display help for command
```

## Example

```sh
$ anchor-client-gen path/to/idl.json output/directory
```

This will generate code to `output/directory`:

```
.
├── accounts
│   ├── FooAccount.ts
│   └── index.ts
├── instructions
│   ├── someInstruction.ts
│   ├── otherInstruction.ts
│   ├── index.ts
├── types
│    ├── BarStruct.ts
│    ├── BazEnum.ts
│    └── index.ts
├── programId.ts
└── errors.ts
```

## Using the generated client

The following packages are required for the generated client to work:

- `@solana/web3.js`
- `bn.js`
- `@project-serum/borsh`

Install them in your project with:

```sh
// npm
$ npm install @solana/web3.js bn.js @project-serum/borsh

// yarn
$ yarn add @solana/web3.js bn.js @project-serum/borsh
```

### Instructions

```ts
import { someInstruction } from "./output/directory/instructions"

// call an instruction
const tx = new Transaction()
const fooAccount = new Keypar()

const ix = someInstruction({
  fooParam: "...",
  barParam: "...",
  ...
}, {
  fooAccount: fooAccount.publicKey, // signer
  barAccount: new PublicKey("..."),
  ...
})
tx.add(ix)

sendAndConfirmTransaction(connection, tx, [payer, fooAccount])
```

### Accounts

```ts
import { FooAccount } from "./output/directory/accounts"

// fetch an account
const addr = new PublicKey("...")

const acc = FooAccount.fetch(connection, addr)
if (acc === null) {
  // the fetch method returns null when the account is uninitialized
  console.log("account not found")
  return
}

// convert to a JSON object
const obj = acc.toJSON()
console.log(obj)

// load from JSON
const accFromJSON = FooAccount.fromJSON(obj)
```

### Types

```ts
// structs

import { BarStruct } from "./output/directory/types"

const barStruct = new BarStruct({
  someField: "...",
  otherField: "...",
})

console.log(barStruct.toJSON())
```

```ts
// enums

import { BazEnum } from "./output/directory/types"

const tupleEnum = new BazEnum.SomeTupleKind([true, false, "some value"])
const structEnum = new BazEnum.SomeStructKind({
  field1: "...",
  field2: "...",
})
const discEnum = new BazEnum.SomeDiscriminantKind()

console.log(tupleEnum.toJSON(), structEnum.toJSON(), discEnum.toJSON())
```

```ts
// types are used as arguments in instruction calls (where needed):
const ix = someInstruction({
  someStructField: barStruct,
  someEnumField: tupleEnum,
  ...
}, {
  // accounts
  ...
})

// in case of struct fields, it's also possible to pass them as objects:
const ix = someInstrution({
  someStructField: {
    someField: "...",
    otherField: "...",
  },
  ...,
}, {
  // accounts
  ...
})
```

### Errors

```ts
import { SomeCustomError, fromTxError } from "./output/directory/errors"

try {
  await sendAndConfirmTransaction(c, tx, [payer])
} catch (e) {
  const parsed = fromTxError(e)
  if (parsed !== null && parsed instanceof SomeCustomError) {
    console.log(
      "SomeCustomError was thrown",
      parsed.code,
      parsed.name,
      parsed.msg
    )
  }
}
```

## Program ID

The client generator pulls the program ID from:

- the input IDL
- the `--program-id` flag

These are then written into the `programId.ts` file.

The `PROGRAM_ID` constant inside `programId.ts` can be (and should be) modified to define the correct program ID as the client relies on it to do checks when fetching accounts etc. The `PROGRAM_ID` constant is safe to modify as it will be preserved across multiple code generations. The imports in this file are also preserved.
