import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";

export const FOOD_COMPONENT = new PublicKey(
    "BEox2GnPkZ1upBAdUi7FVqTstjsC4tDjsbTpTiE17bah",
);
export const MAP_COMPONENT = new PublicKey(
    "2dZ5DLJhEVFRA5xRnRD779ojsWsf3HMi6YB1zmVDdsYb",
);
export const PLAYER_COMPONENT = new PublicKey(
    "2ewyq31Atu7yLcYMg51CEa22HmcCSJwM4jjHH8kKVAJw",
);
export const ANTEROOM_COMPONENT = new PublicKey(
    "EbGkJPaMY8XCJCNjkWwk971xzE32X5LBPg5s2g4LDYcW",
);

export const INIT_PLAYER = new PublicKey(
    "58N5j49P3u351T6DSFKhPeKwBiXGnXwaYE1nWjtVkRZQ",
);
export const INIT_ANTEROOM = new PublicKey(
    "AxmRc9buNLgWVMinrH2WunSxKmdsBXVCghhYZgh2hJT6",
);
export const INIT_GAME = new PublicKey(
    "NrQkd31YsAWX6qyuLgktt4VPG4Q2DY94rBq7fWdRgo7",
);
export const EAT_FOOD = new PublicKey(
    "EdLga9mFADH4EjPY6RsG1LF7w8utVuWDgyLVRrA8YzzN",
);
export const EAT_PLAYER = new PublicKey(
    "F6rDhVKjVTdGKdxEK9UWfFDcxeT3vFbAckX6U2aWeEKZ",
);
export const JOIN_GAME = new PublicKey(
    "DViN676ajvuWryjWHxk2EF7MvQLgHNqhj4m32p1xLBDB",
);
export const MOVEMENT = new PublicKey(
    "9rthxrCfneJKfPtv8PQmYk7hGQsUfeyeDKRp3uC4Uwh6",
);
export const EXIT_GAME = new PublicKey(
    "wdH5MUvXcyKM58yffCxhRQfB5jLQHpnWZhhdYhLCThf",
);
export const SPAWN_FOOD = new PublicKey(
    "GP3L2w9SP9DASTJoJdTAQFzEZRHprMLaxGovxeMrvMNe",
);
export const INIT_FOOD = new PublicKey(
    "4euz4ceqv5ugh1x6wZP3BsLNZHqBxQwXcK59psw5KeQw",
);
export const BUY_IN = new PublicKey(
    "CLC46PuyXnSuZGmUrqkFbAh7WwzQm8aBPjSQ3HMP56kp",
);
export const CASH_OUT = new PublicKey(
    "BAP315i1xoAXqbJcTT1LrUS45N3tAQnNnPuNQkCcvbAr",
);

export const SOL_USDC_POOL_ID = "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2";

export const CONNECTION_STRING =
    "https://proud-late-lambo.solana-devnet.quiknode.pro/ec12ab7b183190f9cfd274049f6ab83396c22e7d";
export const connection = new Connection(CONNECTION_STRING); //"https://devnet.helius-rpc.com/?api-key=cba33294-aa96-414c-9a26-03d5563aa676");

export const endpoints = [
    "https://supersize-fra.magicblock.app",
    "https://supersize.magicblock.app",
    "https://supersize-sin.magicblock.app",
];

/*
export const endpoints = [
    "https://supersize-mainnet.magicblock.app",
    "https://supersize-mainnet-bos.magicblock.app",
    "https://supersize-mainnet-sin.magicblock.app",
];
*/

/*
export const endpointToWorldMap: Record<string, { worldId: anchor.BN; worldPda: PublicKey }> = {
    "https://supersize-mainnet-sin.magicblock.app": {
        worldId: new anchor.BN(1),
        worldPda: new PublicKey('9LKNh9Ma4WjGUHvohbAAdGpZFNUWmgEQRRgvYwRL25ma'),
    },
    "https://supersize-mainnet-bos.magicblock.app": {
        worldId: new anchor.BN(2),
        worldPda: new PublicKey('5Fj5HJud66muuDyateWdP2HAPkED7CnyApDQBMreVQQH'),
    },
    "https://supersize-mainnet.magicblock.app": {
        worldId: new anchor.BN(3),
        worldPda: new PublicKey('8XG8vqYo1vxURMXuU7RboftYGVWYq11M41HCzHLYzejt'),
    },
}; */

export const endpointToWorldMap: Record<
    string,
    { worldId: anchor.BN; worldPda: PublicKey }
> = {
    "https://supersize-sin.magicblock.app": {
        worldId: new anchor.BN(1666),
        worldPda: new PublicKey("BQ4vkTpteu5EcM5dYTSCGAQKbW5JumeyLm3o6yvyzqHw"),
    },
    "https://supersize.magicblock.app": {
        worldId: new anchor.BN(1731),
        worldPda: new PublicKey("EuCCHZwFm6AiGe7ZzPoVus7fpNGFETYFinvNyZTtFVHF"),
    },
    "https://supersize-fra.magicblock.app": {
        worldId: new anchor.BN(1727),
        worldPda: new PublicKey("A5F8bV8wyMNS4dLpfckfxpfHFBTdgd8FW34K7UwxCNvX"),
    },
};

export const options = ["Europe", "America", "Asia"];

export const API_BASE_URL = "http://localhost:3000/api";
export const scale = 1;
