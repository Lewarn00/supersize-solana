use bolt_lang::*;
use map::Map;
use section::Section;

declare_id!("GP3L2w9SP9DASTJoJdTAQFzEZRHprMLaxGovxeMrvMNe");

#[error_code]
pub enum SupersizeError {
    #[msg("Food component doesn't belong to map.")]
    MapKeyMismatch,
    #[msg("Food not in section provided.")]
    FoodOutOfBounds,
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
pub mod spawn_food {

    pub fn execute(ctx: Context<Components>, _args_p: Vec<u8>) -> Result<Components> {
        let map = &mut ctx.accounts.map;
        let section = &mut ctx.accounts.section;

        require!(map.key() == section.map.expect("Section map key not set"), SupersizeError::MapKeyMismatch);

        let queue_len = map.food_queue;
        if let Some(current_food) = map.next_food {
            let (x, y, size) = current_food.unpack();
            require!(
                is_food_inside_bounds(x, y, size as u16, section.top_left_x, section.top_left_y),
                SupersizeError::FoodOutOfBounds
            );
            if section.food.len() < 100 {
                let newfood = section::Food { data: current_food.data };
                section.food.push(newfood);
                map.total_food_on_map += size as u64;
            }else{
                map.food_queue = queue_len + size as u64;
            }
        }
        if queue_len > 0 {
            let slot = Clock::get()?.slot;
            let xorshift_output = xorshift64(slot);
            let hardvar : u64 = queue_len as u64 + 1;
            let random_shift = (xorshift_output % 13) + 3; 
            let mixed_value_food_x = (xorshift_output.wrapping_mul(hardvar * 3) + xorshift_output) ^ (hardvar * 3).wrapping_shl(5);
            let mixed_value_food_y = (xorshift_output.wrapping_mul(hardvar * 5) + xorshift_output) ^ (hardvar * 5).wrapping_shl(random_shift as u32);
            let food_x = mixed_value_food_x % map.width as u64;
            let food_y = mixed_value_food_y % map.height as u64;
            let food_size = 1u8; // always 1 here
            let newfood = map::Food::pack(food_x as u16, food_y as u16, food_size);
            map.next_food = Some(newfood);
            map.food_queue = queue_len - food_size as u64;
        }else{
            map.next_food = None;
        }
        
        Ok(ctx.accounts)
    }

    #[system_input]
    pub struct Components {
        pub map: Map,
        pub section: Section,
    }

}
