use bolt_lang::*;

declare_id!("BEox2GnPkZ1upBAdUi7FVqTstjsC4tDjsbTpTiE17bah");

#[component(delegate)]
pub struct Section {
    pub map: Option<Pubkey>,
    pub top_left_x: u16,
    pub top_left_y: u16,
    #[max_len(100)]
    pub food: Vec<Food>,
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

impl Default for Section {
    fn default() -> Self {
        Self::new(SectionInit {
            map: None,
            top_left_x: 0,
            top_left_y: 0,
            food: Vec::new(),
        })
    }
}