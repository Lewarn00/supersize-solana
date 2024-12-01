use bolt_lang::*;

declare_id!("2dZ5DLJhEVFRA5xRnRD779ojsWsf3HMi6YB1zmVDdsYb");

#[component(delegate)]
pub struct Map {
    #[max_len(100)]
    pub name: String,
    pub authority: Option<Pubkey>,
    pub width: u16,
    pub height: u16,
    pub base_buyin: f64,
    pub max_buyin: f64,
    pub min_buyin: f64,
    pub max_players: u8,
    pub total_active_buyins: f64,
    pub total_food_on_map: u64,
    pub food_queue: u64,
    pub next_food: Option<Food>,
    pub frozen: bool,
}

#[component_deserialize(delegate)]
pub struct Food{
    pub data: [u8; 4]
}

impl Food {
    pub fn unpack(&self) -> (u16, u16, u8) {
        let packed = u32::from_le_bytes(self.data);

        // Extract the values using bit masking and shifting
        let x = (packed & 0x3FFF) as u16;          // Extract bits 0-14
        let y = ((packed >> 14) & 0x3FFF) as u16;  // Extract bits 14-28
        let size = ((packed >> 28) & 0x0F) as u8;     // Extract bits 28-32

        (x, y, size)
    }

    pub fn pack(x: u16, y: u16, size: u8) -> Self {
        assert!(x < 16_384, "x out of range");
        assert!(y < 16_384, "y out of range");
        assert!(size < 16, "z out of range");

        // Combine the values into a single u32
        let packed = ((size as u32) << 28) | ((y as u32) << 14) | (x as u32);

        // Convert the u32 into a 4-byte array
        let data = packed.to_le_bytes(); // Little-endian byte order

        Self { data }
    }
}

impl Default for Map {
    fn default() -> Self {
        Self::new(MapInit{
            name: "ffa".to_string(),
            authority: None,
            width: 4000,
            height: 4000,
            base_buyin: 1000.0,
            max_buyin: 1000.0,
            min_buyin: 1000.0,
            max_players: 20,
            total_active_buyins: 0.0,
            total_food_on_map: 0,
            food_queue: 0, 
            next_food: None,
            frozen: false,
        })
    }
}