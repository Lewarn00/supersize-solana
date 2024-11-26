use bolt_lang::*;
use player::Player;
use map::Map;
use section::Section;

declare_id!("9rthxrCfneJKfPtv8PQmYk7hGQsUfeyeDKRp3uC4Uwh6");

#[error_code]
pub enum SupersizeError {
    #[msg("Not owner of this player.")]
    NotOwner,
    #[msg("Player not in game.")]
    NotInGame,
    #[msg("Component doesn't belong to map.")]
    MapKeyMismatch,
}

pub fn xorshift64(seed: u64) -> u64 {
    let mut x = seed;
    x ^= x << 13;
    x ^= x >> 7;
    x ^= x << 17;
    x
}

pub fn is_food_inside_bounds(x: u16, y: u16, size: u16, top_left_x: u16, top_left_y: u16) -> bool {
    x > size &&
    x - size >= top_left_x &&
    x + size < top_left_x + 1000 &&
    y > size &&
    y - size >= top_left_y &&
    y + size < top_left_y + 1000
}

#[system]
pub mod movement {

    pub fn execute(ctx: Context<Components>, args: Args) -> Result<Components> {
        let map = &mut ctx.accounts.map;
        let player = &mut ctx.accounts.player;
        let section = &mut ctx.accounts.section;
        let authority = *ctx.accounts.authority.key;
        
        require!(player.authority == Some(authority), SupersizeError::NotOwner);
        require!(player.mass != 0, SupersizeError::NotInGame);
        require!(map.key() == player.map.expect("Player map key not set"), SupersizeError::MapKeyMismatch);
        require!(map.key() == section.map.expect("Section map key not set"), SupersizeError::MapKeyMismatch);
        
        if player.mass > 50000 {
            player.mass = 0;
            player.x = 50000;
            player.y = 50000;
        }
    
        let target_x = args.x as u16;
        let target_y = args.y as u16;
        let mut boosting = args.boost as bool;

        player.target_x = Some(target_x);
        player.target_y = Some(target_y);

        let player_mass = player.mass as f64 / 10.0;
        let player_radius = 4.0 + player_mass.sqrt() * 6.0;
        let player_x = player.x;
        let player_y = player.y;
    
        let entry_fee = map.base_buyin;

        let dx = target_x as f64 - player_x as f64;
        let dy = target_y as f64 - player_y as f64;
        let dist = (dx.powf(2.0) + dy.powf(2.0)).sqrt();
        let deg = dy.atan2(dx);
        
        let mut effective_mass = 100.0;
        if player_mass > 100.0 {
            effective_mass = player_mass;
        }

        let mut slow_down : f64 = 1.0;
        if player.speed <= 6.25 {
            slow_down = (effective_mass as f64/10.0).ln() / 1.504 - 0.531;
        }
        
        if player.mass >= 100 {
            let current_timestamp = Clock::get()?.unix_timestamp;
            if boosting || player.boost_click_time.map_or(false, |boost_click_time| current_timestamp - boost_click_time < 1) {
                if boosting{
                    player.boost_click_time = Some(current_timestamp);
                }

                let mut boosted_speed = 12.0;
                if player_mass > 100.0 {
                    boosted_speed = -0.00008 * player_mass + 12.0; 
                }
                player.speed = boosted_speed as f32;

                let difference = -player.score * 0.002;
                player.score = player.score + difference;

                let steps = ((player.mass as f64 - player.score * 1000.0 / entry_fee)).floor() as u64;

                if steps >= 1 {
                    player.mass = player.mass - steps;
                    let unit_x = dx / dist;
                    let unit_y = dy / dist;

                    let slot = Clock::get()?.slot;
                    let xorshift_output = xorshift64(slot);
                    let random_shift = (xorshift_output % 13) + 3; 

                    let free_space = 100 - section.food.len() as u64;
                    let steps_to_add = if steps < free_space { steps } else { free_space };
                    let remaining_steps = steps - steps_to_add;
                    map.food_queue += remaining_steps;

                    for n in 0..steps_to_add {
                        let hardvarx: u64 = xorshift_output.wrapping_mul(free_space as u64 + n + 1);
                        let hardvary: u64 = xorshift_output.wrapping_mul(free_space as u64 + n + 1).wrapping_shl(random_shift as u32);
                        let seedx = (hardvarx % 100 as u64) + 1; 
                        let seedy = (hardvary % 100) + 1;
                        let pseudo_random_float_x : f64 = seedx as f64 / 100.0 + 1.2;
                        let pseudo_random_float_y : f64 = seedy as f64 / 100.0 + 1.2;
                        let offset_x = -unit_x * player_radius * pseudo_random_float_x;
                        let offset_y = -unit_y * player_radius * pseudo_random_float_y;
                        let food_x = player_x as i16 + offset_x.round() as i16;
                        let food_y = player_y as i16 + offset_y.round() as i16;
                        let clamped_food_x = (food_x as u16).clamp(0, map.width);
                        let clamped_food_y = (food_y as u16).clamp(0, map.height);
                        let food_unit = (player.mass as f64 / 1000.0).floor().clamp(1.0, 10.0).round() as u8;

                        if is_food_inside_bounds(clamped_food_x, clamped_food_y, food_unit as u16, section.top_left_x, section.top_left_y)
                        {
                            let newfood = section::Food::pack(clamped_food_x, clamped_food_y, food_unit);
                            section.food.push(newfood);
                            map.total_food_on_map += food_unit as u64;
                        } else {
                            map.food_queue += food_unit as u64;
                        }
                    }
                }
            }
        } else {
            boosting = false;
        }

        if player.speed > 6.25 && !boosting {
            player.speed -= 0.5;
        }
        let mut scale_up = 3.0;
        if player_mass < 100.0 {
            scale_up = -0.01 * player_mass + 4.0;
        }
        let delta_y = player.speed as f64 * scale_up * deg.sin() / slow_down;
        let delta_x = player.speed as f64 * scale_up * deg.cos() / slow_down; 
        player.y = ((player_y as f64 + delta_y).round() as u16).clamp(0, map.height);
        player.x = ((player_x as f64 + delta_x).round() as u16).clamp(0, map.width);

        Ok(ctx.accounts)
    }

    #[system_input]
    pub struct Components {
        pub player: Player,
        pub section: Section,
        pub map: Map,
    }

    #[arguments]
    struct Args {
        x: u16,
        y: u16,
        boost: bool,
    }

}
