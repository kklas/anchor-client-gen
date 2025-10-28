import * as CStyleEnum from "./CStyleEnum"
import * as FooEnum from "./FooEnum"

export { BarStruct } from "./BarStruct"
export type { BarStructFields, BarStructJSON } from "./BarStruct"
export { CStyleEnum }

/** C-style enum type */
export type CStyleEnumKind =
  | CStyleEnum.First
  | CStyleEnum.Second
  | CStyleEnum.Third
export type CStyleEnumJSON =
  | CStyleEnum.FirstJSON
  | CStyleEnum.SecondJSON
  | CStyleEnum.ThirdJSON

export { FooEnum }

/** Enum type */
export type FooEnumKind =
  | FooEnum.Unnamed
  | FooEnum.UnnamedSingle
  | FooEnum.Named
  | FooEnum.Struct
  | FooEnum.OptionStruct
  | FooEnum.VecStruct
  | FooEnum.NoFields
export type FooEnumJSON =
  | FooEnum.UnnamedJSON
  | FooEnum.UnnamedSingleJSON
  | FooEnum.NamedJSON
  | FooEnum.StructJSON
  | FooEnum.OptionStructJSON
  | FooEnum.VecStructJSON
  | FooEnum.NoFieldsJSON

export { FooStruct } from "./FooStruct"
export type { FooStructFields, FooStructJSON } from "./FooStruct"
