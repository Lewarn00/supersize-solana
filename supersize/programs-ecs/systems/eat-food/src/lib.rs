use bolt_lang::*;
use player::Player;
use map::Map;
use section::Section;

declare_id!("EdLga9mFADH4EjPY6RsG1LF7w8utVuWDgyLVRrA8YzzN");

#[error_code]
pub enum SupersizeError {
    #[msg("Not owner of this player.")]
    NotOwner,
    #[msg("Player not in game.")]
    NotInGame,
    #[msg("Component doesn't belong to map.")]
    MapKeyMismatch,
}

#[system]
pub mod eat_food {

    pub fn execute(ctx: Context<Components>, _args_p: Vec<u8>) -> Result<Components> {
        let map = &mut ctx.accounts.map;
        let section = &mut ctx.accounts.section;
        let player = &mut ctx.accounts.player;
        let authority = *ctx.accounts.authority.key;

        require!(map.key() == player.map.expect("Player map key not set"), SupersizeError::MapKeyMismatch);
        require!(map.key() == section.map.expect("Section map key not set"), SupersizeError::MapKeyMismatch);
        require!(player.mass != 0, SupersizeError::NotInGame);

        let player_mass = player.mass as f64 / 10.0;
        let player_radius : f64 = 4.0 + player_mass.sqrt() * 6.0;
        let player_authority = player.authority;
        let player_x = player.x;
        let player_y = player.y;

        require!(player_authority == Some(authority), SupersizeError::NotOwner);

        section.food.retain(|food| {
                let (x, y, size) = food.unpack();
                let dx = (player_x as i16 - x as i16).abs();
                let dy = (player_y as i16 - y as i16).abs();
                if dx < player_radius.ceil() as i16 && dy < player_radius.ceil() as i16 {
                    let distance = ((dx as f64).powf(2.0) + (dy as f64).powf(2.0)).sqrt();
                    if player_radius > size as f64 && distance < player_radius - size as f64 {
                        player.mass += size as u64;
                        player.score += (map.base_buyin as f64 / 1000.0) * size as f64;
                        map.total_food_on_map -= size as u64;
                        false 
                    } else {
                        true
                    }
                } else {
                    true
                }
        });
        
        Ok(ctx.accounts)
    }

    #[system_input]
    pub struct Components {
        pub player: Player,
        pub section: Section,
        pub map: Map,
    }
}
