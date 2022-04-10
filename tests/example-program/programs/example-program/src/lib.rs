use std::str::FromStr;

use anchor_lang::prelude::*;

declare_id!("3rTQ3R4B2PxZrAyx7EUefySPgZY8RhJf16cZajbmrzp8");

#[program]
pub mod example_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.state.set_inner(State::default());
        Ok(())
    }

    pub fn initialize_with_values(
        ctx: Context<Initialize>,
        bool_field: bool,
        u8_field: u8,
        i8_field: i8,
        u16_field: u16,
        i16_field: i16,
        u32_field: u32,
        i32_field: i32,
        f32_field: f32,
        u64_field: u64,
        i64_field: i64,
        f64_field: f64,
        u128_field: u128,
        i128_field: i128,
        bytes_field: Vec<u8>,
        string_field: String,
        pubkey_field: Pubkey,
        vec_field: Vec<u64>,
        vec_struct_field: Vec<FooStruct>,
        option_field: Option<bool>,
        option_struct_field: Option<FooStruct>,
        struct_field: FooStruct,
        array_field: [bool; 3],
        enum_field_1: FooEnum,
        enum_field_2: FooEnum,
        enum_field_3: FooEnum,
        enum_field_4: FooEnum,
    ) -> Result<()> {
        ctx.accounts.state.set_inner(State {
            bool_field,
            u8_field,
            i8_field,
            u16_field,
            i16_field,
            u32_field,
            i32_field,
            f32_field,
            u64_field,
            i64_field,
            f64_field,
            u128_field,
            i128_field,
            bytes_field,
            string_field,
            pubkey_field,
            vec_field,
            vec_struct_field,
            option_field,
            option_struct_field,
            struct_field,
            array_field,
            enum_field_1,
            enum_field_2,
            enum_field_3,
            enum_field_4,
        });

        Ok(())
    }

    // a separate instruction due to initialize_with_values having too many arguments
    // https://github.com/solana-labs/solana/issues/23978
    pub fn initialize_with_values2(
        ctx: Context<Initialize2>,
        vec_of_option: Vec<Option<u64>>,
    ) -> Result<()> {
        ctx.accounts.state.set_inner(State2 { vec_of_option });
        Ok(())
    }

    pub fn cause_error(_ctx: Context<CauseError>) -> Result<()> {
        return Err(error!(ErrorCode::SomeError));
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum FooEnum {
    Unnamed(bool, u8, BarStruct),
    UnnamedSingle(BarStruct),
    Named {
        bool_field: bool,
        u8_field: u8,
        nested: BarStruct,
    },
    Struct(BarStruct),
    OptionStruct(Option<BarStruct>),
    VecStruct(Vec<BarStruct>),
    NoFields,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct BarStruct {
    some_field: bool,
    other_field: u8,
}

impl Default for BarStruct {
    fn default() -> Self {
        return BarStruct {
            some_field: true,
            other_field: 10,
        };
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct FooStruct {
    field1: u8,
    field2: u16,
    nested: BarStruct,
    vec_nested: Vec<BarStruct>,
    option_nested: Option<BarStruct>,
    enum_field: FooEnum,
}

impl Default for FooStruct {
    fn default() -> Self {
        return FooStruct {
            field1: 123,
            field2: 999,
            nested: BarStruct::default(),
            vec_nested: vec![BarStruct::default()],
            option_nested: Some(BarStruct::default()),
            enum_field: FooEnum::Named {
                bool_field: true,
                u8_field: 15,
                nested: BarStruct::default(),
            },
        };
    }
}

#[account]
pub struct State {
    bool_field: bool,
    u8_field: u8,
    i8_field: i8,
    u16_field: u16,
    i16_field: i16,
    u32_field: u32,
    i32_field: i32,
    f32_field: f32,
    u64_field: u64,
    i64_field: i64,
    f64_field: f64,
    u128_field: u128,
    i128_field: i128,
    bytes_field: Vec<u8>,
    string_field: String,
    pubkey_field: Pubkey,
    vec_field: Vec<u64>,
    vec_struct_field: Vec<FooStruct>,
    option_field: Option<bool>,
    option_struct_field: Option<FooStruct>,
    struct_field: FooStruct,
    array_field: [bool; 3],
    enum_field_1: FooEnum,
    enum_field_2: FooEnum,
    enum_field_3: FooEnum,
    enum_field_4: FooEnum,
}

impl Default for State {
    fn default() -> Self {
        // some arbitrary default values
        return State {
            bool_field: true,
            u8_field: 234,
            i8_field: -123,
            u16_field: 62345,
            i16_field: -31234,
            u32_field: 1234567891,
            i32_field: -1234567891,
            f32_field: 123456.5,
            u64_field: u64::MAX / 2 + 10,
            i64_field: i64::MIN / 2 - 10,
            f64_field: 1234567891.345,
            u128_field: u128::MAX / 2 + 10,
            i128_field: i128::MIN / 2 - 10,
            bytes_field: vec![1, 2, 255, 254],
            string_field: String::from("hello"),
            pubkey_field: Pubkey::from_str("EPZP2wrcRtMxrAPJCXVEQaYD9eH7fH7h12YqKDcd4aS7").unwrap(),
            vec_field: vec![1, 2, 100, 1000, u64::MAX],
            vec_struct_field: vec![FooStruct::default()],
            option_field: None,
            option_struct_field: Some(FooStruct::default()),
            struct_field: FooStruct::default(),
            array_field: [true, false, true],
            enum_field_1: FooEnum::Unnamed(false, 10, BarStruct::default()),
            enum_field_2: FooEnum::Named {
                bool_field: true,
                u8_field: 20,
                nested: BarStruct::default(),
            },
            enum_field_3: FooEnum::Struct(BarStruct::default()),
            enum_field_4: FooEnum::NoFields,
        };
    }
}

#[account]
pub struct State2 {
    vec_of_option: Vec<Option<u64>>,
}
impl Default for State2 {
    fn default() -> Self {
        return State2 {
            vec_of_option: vec![None, Some(10)],
        };
    }
}

#[derive(Accounts)]
pub struct NestedAccounts<'info> {
    clock: Sysvar<'info, Clock>,
    rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        space = 8 + 1000, // TODO: use exact space required
        payer = payer,
    )]
    state: Account<'info, State>,

    nested: NestedAccounts<'info>,

    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Initialize2<'info> {
    #[account(
        init,
        space = 8 + 1000, // TODO: use exact space required
        payer = payer,
    )]
    state: Account<'info, State2>,

    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CauseError {}

#[error_code]
pub enum ErrorCode {
    #[msg("Example error.")]
    SomeError,
    #[msg("Another error.")]
    OtherError,
}
