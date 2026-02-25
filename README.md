# anchor-client-gen

[![npm](https://img.shields.io/npm/v/anchor-client-gen/latest.svg?style=flat-square&color=blue)](https://www.npmjs.com/package/anchor-client-gen/v/latest)
[![npm](https://img.shields.io/npm/v/anchor-client-gen/beta.svg?style=flat-square&color=blue)](https://www.npmjs.com/package/anchor-client-gen/v/beta)
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/kklas/anchor-client-gen/Tests?label=build&style=flat-square)](https://github.com/kklas/anchor-client-gen/actions/workflows/tests.yaml?query=branch%3Amaster)

Generate typescript solana web3 clients from [anchor](https://github.com/project-serum/anchor) IDLs.

## Installation

```sh
# npm
$ npm install --global anchor-client-gen

# yarn
$ yarn global add anchor-client-gen
```

To get the beta build which has unreleased features, install with `anchor-client-gen@beta`.

## Usage

```
Usage: main [options] <idl> <out>

Generate solana web3 client code from the specified anchor IDL.

Arguments:
  idl                        anchor IDL file path or '-' to read from stdin
  out                        output directory

Options:
  --program-id <PROGRAM_ID>  optional program ID to be included in the code
  -V, --version              output the version number
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
├── errors
│   ├── anchor.ts
│   ├── custom.ts
│   └── index.ts
├── instructions
│   ├── someInstruction.ts
│   ├── otherInstruction.ts
│   └── index.ts
├── types
│   ├── BarStruct.ts
│   ├── BazEnum.ts
│   └── index.ts
├── utils
│   ├── borsh.ts
│   ├── borshAddress.ts
│   └── index.ts
└── programId.ts
```

For more examples of the generated code, check out the [examples](https://github.com/kklas/anchor-client-gen/tree/master/examples) directory.

## Using the generated client

The generated client includes a self-contained Borsh serialization module (`utils/borsh.ts`) with no external serialization dependencies. The only required runtime dependency is:

- `@solana/kit`

Install it in your project with:

```sh
# npm
$ npm install @solana/kit

# yarn
$ yarn add @solana/kit
```

The generated code uses native `bigint` for 64/128/256-bit integers and `Uint8Array` for byte data.

### Instructions

```ts
import { someInstruction } from "./output/directory/instructions"

const fooAccount = generateKeyPairSigner()

// call an instruction
const ix = someInstruction({
  args: {
    fooParam: "...",
    barParam: "...",
    ...
  },
  accounts: {
    fooAccount: fooAccount, // signer
    barAccount: address("..."),
    ...
  }
})

const blockhash = await rpc
  .getLatestBlockhash({ commitment: "finalized" })
  .send()

const tx = await pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => appendTransactionMessageInstruction(ix, tx),
  (tx) => setTransactionMessageFeePayerSigner(payer, tx),
  (tx) =>
    setTransactionMessageLifetimeUsingBlockhash(
      {
        blockhash: blockhash.value.blockhash,
        lastValidBlockHeight: blockhash.value.lastValidBlockHeight,
      },
      tx
    ),
  (tx) => signTransactionMessageWithSigners(tx)
)

assertIsSendableTransaction(tx)
assertIsTransactionWithBlockhashLifetime(tx)

const sendAndConfirmFn = sendAndConfirmTransactionFactory({
  rpc,
  rpcSubscriptions,
})
await sendAndConfirmFn(tx)
```

### Accounts

```ts
import { FooAccount } from "./output/directory/accounts"

// fetch an account
const addr = address("...")

const acc = FooAccount.fetch(rpc, addr)
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
  args: {
    someStructField: barStruct,
    someEnumField: tupleEnum,
    ...
  },
  accounts: {
    // accounts
    ...
  }
})

// in case of struct fields, it's also possible to pass them as objects:
const ix2 = someInstrution({
  args: {
    someStructField: {
      someField: "...",
      otherField: "...",
    },
    ...,
  },
  accounts: {
    // accounts
    ...
  }
})
```

### Errors

```ts
import { fromTxError } from "./output/directory/errors"
import { SomeCustomError } from "./output/directory/errors/custom"

try {
  await sendAndConfirmFn(tx)
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

## Versioning

The package minor versions match anchor minor versions. So, for example, package version `v0.22.x` will match anchor `v0.22.y`. The earliest supported anchor version is `v0.22`, but the generator probably also works with older versions of anchor since the IDL format is mostly backwards compatible.
