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
        let x = (packed & 0x1FFF) as u16;          // Extract bits 0-12
        let y = ((packed >> 13) & 0x1FFF) as u16;  // Extract bits 13-25
        let size = ((packed >> 26) & 0x07) as u8;     // Extract bits 26-28

        (x, y, size)
    }

    pub fn pack(x: u16, y: u16, size: u8) -> Self {
        assert!(x < 8000, "x out of range");
        assert!(y < 8000, "y out of range");
        assert!(size < 8, "z out of range");

        // Combine the values into a single u32
        let packed = ((size as u32) << 26) | ((y as u32) << 13) | (x as u32);

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