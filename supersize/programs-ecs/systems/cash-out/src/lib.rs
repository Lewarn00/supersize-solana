use bolt_lang::*;
use anteroom::Anteroom;
use player::Player;
use anchor_spl::token::{TokenAccount, Transfer};

declare_id!("BAP315i1xoAXqbJcTT1LrUS45N3tAQnNnPuNQkCcvbAr");

#[error_code]
pub enum SupersizeError {
    #[msg("Not owner of this player.")]
    NotOwner,
    #[msg("Player still in game.")]
    StillInGame,
    #[msg("Invalid game vault.")]
    InvalidGameVault,
    #[msg("Payout account mismatch.")]
    InvalidPayoutAccount,
    #[msg("Invalid pda.")]
    InvalidPda,
    #[msg("Invalid game vault owner.")]
    InvalidGameVaultOwner,
    #[msg("Invalid supersize payout account.")]
    InvalidSupersizeTokenAccount,
    #[msg("Invalid game owner payout account.")]
    InvalidGameOwnerTokenAccount,
    #[msg("Invalid referrer token account.")]
    InvalidReferrerTokenAccount,
    #[msg("Token decimals not set.")]
    MissingTokenDecimals,
    #[msg("Token mint mismatch.")]
    InvalidMint,
    #[msg("Component doesn't belong to map.")]
    MapKeyMismatch,
}

pub fn get_amounts(final_score: f64, is_referred: bool) -> (f64, f64, f64, f64) {
    if is_referred {
        ( (final_score * 98.0) / 100.0,
        (final_score * 0.9) / 100.0,
        (final_score * 0.9) / 100.0,
        (final_score * 0.2) / 100.0)
    } else {
        ( (final_score * 98.0) / 100.0,
        (final_score * 1.0) / 100.0,
        (final_score * 1.0) / 100.0,
        0f64)
    }
}

#[system]
pub mod cash_out {

    pub fn execute(ctx: Context<Components>, _args_p: Vec<u8>) -> Result<Components> {

        let authority = *ctx.accounts.authority.key;

        //require!(ctx.accounts.player.authority == Some(authority), SupersizeError::NotOwner);
        require!(ctx.accounts.player.map == ctx.accounts.anteroom.map, SupersizeError::MapKeyMismatch);
        require!(ctx.accounts.player.mass == 0, SupersizeError::StillInGame);

        let player_token_account: TokenAccount = TokenAccount::try_deserialize_unchecked(
            &mut (ctx.sender_token_account()?.to_account_info().data.borrow()).as_ref()
        )?;
        require!(
            player_token_account.owner == authority,
            SupersizeError::NotOwner
        );
        require!(
            ctx.sender_token_account()?.key() == ctx.accounts.player.payout_token_account.expect("Player payout account not set"),
            SupersizeError::InvalidPayoutAccount
        );
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
        let (derived_token_account_owner_pda, bump) = Pubkey::find_program_address(token_account_owner_pda_seeds, &exit_pid);
        
        require!(
            derived_token_account_owner_pda == ctx.token_account_owner_pda()?.key(),
            SupersizeError::InvalidPda
        );
        require!(
            derived_token_account_owner_pda == vault_token_account.owner,
            SupersizeError::InvalidGameVaultOwner
        );
        require!(
            vault_token_account.mint == ctx.accounts.anteroom.token.expect("Vault mint not set"),
            SupersizeError::InvalidMint
        );

        let supersize_parent_account: Pubkey = pubkey!("DdGB1EpmshJvCq48W1LvB1csrDnC4uataLnQbUVhp6XB");
        let supersize_token_account: TokenAccount = TokenAccount::try_deserialize_unchecked(
            &mut (ctx.supersize_token_account()?.to_account_info().data.borrow()).as_ref()
        )?;
        require!(
            supersize_parent_account == supersize_token_account.owner,
            SupersizeError::InvalidSupersizeTokenAccount
        );
        require!(
            ctx.game_owner_token_account()?.key() == ctx.accounts.anteroom.gamemaster_token_account.expect("Game owner token account not set"),
            SupersizeError::InvalidGameOwnerTokenAccount
        );

        let seeds = &[b"token_account_owner_pda".as_ref(), map_pubkey.as_ref(), &[bump]];
        let pda_signer = &[&seeds[..]];
        
        let decimals = ctx.accounts.anteroom.token_decimals.ok_or(SupersizeError::MissingTokenDecimals)?;
        let scale_factor = 10_u64.pow(decimals);
        let final_score = ctx.accounts.player.score;

        let (player_amount, game_owner_amount, supersize_amount, referrer_amount) = get_amounts(final_score, ctx.accounts.player.referrer_key.is_some());

        let (scaled_final_score, scaled_game_owner_amount, scaled_supersize_amount, scaled_referrer_amount) = 
            ((player_amount * scale_factor as f64).round() as u64,
            (game_owner_amount * scale_factor as f64).round() as u64,
            (supersize_amount * scale_factor as f64).round() as u64,
            (referrer_amount * scale_factor as f64).round() as u64);

        let transfer_instruction_player = Transfer {
            from: ctx.vault_token_account()?.to_account_info(),
            to: ctx.sender_token_account()?.to_account_info(),
            authority: ctx.token_account_owner_pda()?.to_account_info(),
        };
    
        let cpi_ctx_player = CpiContext::new_with_signer(
            ctx.token_program()?.to_account_info(),
            transfer_instruction_player,
            pda_signer,
        );
        
        let transfer_instruction_owner = Transfer {
            from: ctx.vault_token_account()?.to_account_info(),
            to: ctx.game_owner_token_account()?.to_account_info(),
            authority: ctx.token_account_owner_pda()?.to_account_info(),
        };
    
        let cpi_ctx_owner = CpiContext::new_with_signer(
            ctx.token_program()?.to_account_info(),
            transfer_instruction_owner,
            pda_signer,
        );

        let transfer_instruction_supersize = Transfer {
            from: ctx.vault_token_account()?.to_account_info(),
            to: ctx.supersize_token_account()?.to_account_info(),
            authority: ctx.token_account_owner_pda()?.to_account_info(),
        };
    
        let cpi_ctx_supersize = CpiContext::new_with_signer(
            ctx.token_program()?.to_account_info(),
            transfer_instruction_supersize,
            pda_signer,
        );
        anchor_spl::token::transfer(cpi_ctx_player, scaled_final_score)?;
        anchor_spl::token::transfer(cpi_ctx_owner, scaled_game_owner_amount)?;
        anchor_spl::token::transfer(cpi_ctx_supersize, scaled_supersize_amount)?;

        if scaled_referrer_amount > 0 {
            require!(
                ctx.referrer_token_account()?.key() == ctx.accounts.player.referrer_token_account.unwrap(),
                SupersizeError::InvalidReferrerTokenAccount
            );

            let transfer_instruction_referrer = Transfer {
                from: ctx.vault_token_account()?.to_account_info(),
                to: ctx.referrer_token_account()?.to_account_info(),
                authority: ctx.token_account_owner_pda()?.to_account_info(),
            };
        
            let cpi_ctx_referrer = CpiContext::new_with_signer(
                ctx.token_program()?.to_account_info(),
                transfer_instruction_referrer,
                pda_signer,
            );

            anchor_spl::token::transfer(cpi_ctx_referrer, scaled_referrer_amount)?;
        }

        let player = &mut ctx.accounts.player;
        player.score = 0.0;
        player.tax = 0.0;
        player.authority = None;
        player.payout_token_account = None;

        Ok(ctx.accounts)
    }

    #[system_input]
    pub struct Components {
        pub player: Player,
        pub anteroom: Anteroom,
    }

    #[extra_accounts]
    pub struct ExtraAccounts {
        #[account(mut)]
        vault_token_account: Account<'info, TokenAccount>,
        #[account(mut)]
        sender_token_account: Account<'info, TokenAccount>,
        #[account(mut)]
        game_owner_token_account: Account<'info, TokenAccount>,
        #[account(mut)]
        supersize_token_account: Account<'info, TokenAccount>,
        #[account(mut)]
        token_account_owner_pda: AccountInfo<'info>,
        #[account(mut)]
        referrer_token_account: Option<Account<'info, TokenAccount>>,
        #[account(mut)]
        signer: Signer<'info>,
        system_program: Program<'info, System>,
        token_program: Program<'info, Token>,
        rent: Sysvar<'info, Rent>,
    }
}
