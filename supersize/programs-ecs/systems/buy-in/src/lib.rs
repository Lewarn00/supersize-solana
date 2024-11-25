use std::str::FromStr;

use bolt_lang::*;
use anteroom::Anteroom;
use player::Player;
use anchor_spl::token::{TokenAccount, Transfer};
use solana_program::{instruction::Instruction, program::invoke};

mod hash;

declare_id!("CLC46PuyXnSuZGmUrqkFbAh7WwzQm8aBPjSQ3HMP56kp");

pub const BUDDY_LINK_PROGRAM_ID: &str = "BUDDYtQp7Di1xfojiCSVDksiYLQx511DPdj2nbtG9Yu5";
// pub const BUDDY_LINK_PROGRAM_ID: &str = "9zE4EQ5tJbEeMYwtS2w8KrSHTtTW4UPqwfbBSEkUrNCA"; // for devnet


#[error_code]
pub enum SupersizeError {
    #[msg("Player already in game.")]
    AlreadyInGame,
    #[msg("Invalid buy in.")]
    InvalidBuyIn,
    #[msg("Invalid game vault.")]
    InvalidGameVault,
    #[msg("Invalid game vault owner.")]
    InvalidGameVaultOwner,
    #[msg("Token mint mismatch.")]
    InvalidMint,
    #[msg("Token decimals not set.")]
    MissingTokenDecimals,
    #[msg("Player component doesn't belong to map.")]
    MapKeyMismatch,
    #[msg("Invalid Buddy Link Program.")]
    InvalidBuddyLinkProgram,
    #[msg("Remaining accounts are not provided.")]
    InvalidRemainingAccounts,
    #[msg("Given referrer is not valid.")]
    InvalidReferrer,
}

#[system]
pub mod buy_in {

    pub fn execute(ctx: Context<Components>, args: Args) -> Result<Components> {

        let buy_in = args.buyin;
        require!(ctx.accounts.anteroom.map == ctx.accounts.player.map, SupersizeError::MapKeyMismatch);
        require!(ctx.accounts.player.score == 0.0, SupersizeError::AlreadyInGame);
        require!(ctx.accounts.player.authority.is_none(), SupersizeError::AlreadyInGame);
        require!(buy_in <= ctx.accounts.anteroom.max_buyin, SupersizeError::InvalidBuyIn);
        require!(buy_in >= ctx.accounts.anteroom.min_buyin, SupersizeError::InvalidBuyIn);
        require!(
            ctx.accounts.anteroom.vault_token_account.expect("Vault token account not set") == ctx.vault_token_account()?.key(),
            SupersizeError::InvalidGameVault
        );

        let vault_token_account: TokenAccount = TokenAccount::try_deserialize_unchecked(
            &mut (ctx.vault_token_account()?.to_account_info().data.borrow()).as_ref()
        )?;

        let exit_pid: Pubkey = pubkey!("BAP315i1xoAXqbJcTT1LrUS45N3tAQnNnPuNQkCcvbAr"); 
        let map_pubkey = ctx.accounts.anteroom.map.expect("Anteroom map key not set");
        let token_account_owner_pda_seeds = &[b"token_account_owner_pda", map_pubkey.as_ref()];
        let (derived_token_account_owner_pda, _bump) = Pubkey::find_program_address(token_account_owner_pda_seeds, &exit_pid);
        require!(
            derived_token_account_owner_pda == vault_token_account.owner,
            SupersizeError::InvalidGameVaultOwner
        );
        require!(
            vault_token_account.mint == ctx.accounts.anteroom.token.expect("Vault mint not set"),
            SupersizeError::InvalidMint
        );

        let decimals = ctx.accounts.anteroom.token_decimals.ok_or(SupersizeError::MissingTokenDecimals)?;
        let wallet_balance = vault_token_account.amount / 10_u64.pow(decimals);
        let player_payout_account = Some(ctx.payout_token_account()?.key());
        let transfer_instruction = Transfer {
            from: ctx.payout_token_account()?.to_account_info(),
            to: ctx.vault_token_account()?.to_account_info(),
            authority: ctx.signer()?.to_account_info(),
        };
    
        let cpi_ctx = CpiContext::new(
            ctx.token_program()?.to_account_info(),
            transfer_instruction,
        );
        let scale_factor = 10_u64.pow(decimals);
        let transfer_amount = (buy_in * scale_factor as f64).round() as u64;
        anchor_spl::token::transfer(cpi_ctx, transfer_amount)?;

        let player_authority = Some(ctx.player_account()?.key());
        let signer = ctx.signer()?;
        let player = &mut ctx.accounts.player;

        if let Some(referrer) = args.referrer {
            /*
            Remaining accounts
        
            Buddy link program
            Buddy profile
            Buddy
            Buddy treasury
            Member
            Referrer member
            Referrer treasury
            Referrer treasury reward
        
            Optional:
            Mint
            Referrer token account
            */

            let remaining_accounts = ctx.remaining_accounts;

            let remaining_account_length = remaining_accounts.len();
            require!(remaining_account_length == 8 || remaining_account_length == 10, SupersizeError::InvalidRemainingAccounts);
        
            let buddy_link_program = remaining_accounts[0].to_account_info();
        
            require!(buddy_link_program.key() == Pubkey::from_str(BUDDY_LINK_PROGRAM_ID).unwrap(), SupersizeError::InvalidBuddyLinkProgram);

            let referrer_token_account: TokenAccount = TokenAccount::try_deserialize_unchecked(
                &mut (remaining_accounts[9].to_account_info().data.borrow()).as_ref()
            )?;

            require!(
                referrer_token_account.mint == ctx.accounts.anteroom.token.expect("Vault mint not set"),
                SupersizeError::InvalidMint
            );

            let other_remaining_accounts = &remaining_accounts[1..];
            let mut account_metas = vec![
                AccountMeta::new(signer.key(), true),
                AccountMeta::new_readonly(signer.key(), false),
            ];
        
            account_metas.extend_from_slice(
            &other_remaining_accounts
                    .iter()
                    .map(|account| AccountMeta {
                        pubkey: account.key(),
                        is_signer: account.is_signer,
                        is_writable: account.is_writable,
                    })
                    .collect::<Vec<AccountMeta>>()
            );
        
            let mut account_infos = vec![
                signer.to_account_info(),
                signer.to_account_info(),
            ];
        
            account_infos.extend_from_slice(&other_remaining_accounts);
        
            let mut instruction_data: Vec<u8> = vec![];
            instruction_data.extend_from_slice(&crate::hash::hash("global:validate_referrer".as_bytes()).to_bytes()[..8]);
        
            let instruction = Instruction {
                program_id: buddy_link_program.key(),
                accounts: account_metas,
                data: instruction_data,
            };

            match invoke(&instruction, &account_infos) {
                Ok(()) => {
                    player.referrer_key = Some(referrer);
                    player.referrer_token_account = Some(remaining_accounts[9].key());
                },
                _ => {
                    return Err(error!(SupersizeError::InvalidReferrer));
                }
            };
        }
        
        player.authority = player_authority;
        player.payout_token_account = player_payout_account;
        player.buy_in = buy_in;
        player.current_game_wallet_balance = wallet_balance as f64;
        player.join_time = Clock::get()?.unix_timestamp;

        Ok(ctx.accounts)
    }

    #[system_input]
    pub struct Components {
        pub player: Player,
        pub anteroom: Anteroom,
    }

    #[arguments]
    struct Args {
        buyin: f64,
        referrer: Option<Pubkey>
    }

    #[extra_accounts]
    pub struct ExtraAccounts {
        #[account(mut)]
        vault_token_account: Account<'info, TokenAccount>,
        #[account(mut)]
        player_account: Account<'info, TokenAccount>,
        #[account(mut)]
        payout_token_account: Account<'info, TokenAccount>,
        #[account(mut)]
        signer: Signer<'info>,
        system_program: Program<'info, System>,
        token_program: Program<'info, Token>,
        rent: Sysvar<'info, Rent>,


        // below account should be provided as remaining account when referrer is set.

        // /// CHECK: this is accounts for buddy link program cpi call
        // #[account()]
        // buddy_link_program: Option<UncheckedAccount<'info>>,
        // /// CHECK: this is accounts for buddy link program cpi call
        // #[account()]
        // buddy_profile: Option<UncheckedAccount<'info>>,
        // /// CHECK: this is accounts for buddy link program cpi call
        // #[account()]
        // buddy: Option<UncheckedAccount<'info>>,
        // /// CHECK: this is accounts for buddy link program cpi call
        // #[account()]
        // buddy_treasury: Option<UncheckedAccount<'info>>,
        // /// CHECK: this is accounts for buddy link program cpi call
        // #[account()]
        // member: Option<UncheckedAccount<'info>>,
        // /// CHECK: this is accounts for buddy link program cpi call
        // #[account()]
        // referrer_member: Option<UncheckedAccount<'info>>,
        // /// CHECK: this is accounts for buddy link program cpi call
        // #[account(mut)]
        // referrer_treasury: Option<UncheckedAccount<'info>>,
        // /// CHECK: this is accounts for buddy link program cpi call
        // #[account()]
        // referrer_treasury_reward: Option<UncheckedAccount<'info>>,
        // /// CHECK: this is accounts for buddy link program cpi call
        // #[account()]
        // mint: Option<UncheckedAccount<'info>>,
        // /// CHECK: this is accounts for buddy link program cpi call
        // #[account()]
        // referrer_token_account: Option<UncheckedAccount<'info>>,
    }
}