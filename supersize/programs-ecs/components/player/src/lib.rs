use bolt_lang::*;

declare_id!("2ewyq31Atu7yLcYMg51CEa22HmcCSJwM4jjHH8kKVAJw");

#[component(delegate)]
pub struct Player {
    #[max_len(20)]
    pub name: String,
    pub authority: Option<Pubkey>,
    pub referrer_key: Option<Pubkey>,
    pub referrer_token_account: Option<Pubkey>,
    pub map: Option<Pubkey>,
    pub buy_in: f64,
    pub payout_token_account: Option<Pubkey>,
    pub current_game_wallet_balance: f64,
    pub tax: f64,
    pub join_time: i64,
    pub x: u16,
    pub y: u16,
    pub target_x: Option<u16>,
    pub target_y: Option<u16>,
    pub score: f64,
    pub mass: u64,
    pub speed: f32,
    pub scheduled_removal_time: Option<i64>,
    pub boost_click_time: Option<i64>,
}

impl Default for Player {
    fn default() -> Self {
        Self::new(PlayerInit{
            name: "unnamed".to_string(),
            authority: None,
            referrer_key: None,
            referrer_token_account: None,
            map: None,
            buy_in: 0.0,
            payout_token_account: None,
            current_game_wallet_balance: 0.0,
            tax: 0.0,
            join_time: 0, 
            x: 50000,
            y: 50000,
            target_x: None,
            target_y: None,
            score: 0.0,
            mass: 0,
            speed: 0.0,
            scheduled_removal_time: None,
            boost_click_time: None,
        })
    }
}

