import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";

export const FOOD_COMPONENT = new PublicKey("BEox2GnPkZ1upBAdUi7FVqTstjsC4tDjsbTpTiE17bah"); 
export const MAP_COMPONENT = new PublicKey("2dZ5DLJhEVFRA5xRnRD779ojsWsf3HMi6YB1zmVDdsYb"); 
export const PLAYER_COMPONENT = new PublicKey("2ewyq31Atu7yLcYMg51CEa22HmcCSJwM4jjHH8kKVAJw");  
export const ANTEROOM_COMPONENT = new PublicKey("EbGkJPaMY8XCJCNjkWwk971xzE32X5LBPg5s2g4LDYcW"); 

export const INIT_ANTEROOM = new PublicKey("AxmRc9buNLgWVMinrH2WunSxKmdsBXVCghhYZgh2hJT6"); 
export const INIT_GAME = new PublicKey("NrQkd31YsAWX6qyuLgktt4VPG4Q2DY94rBq7fWdRgo7");  
export const EAT_FOOD = new PublicKey("EdLga9mFADH4EjPY6RsG1LF7w8utVuWDgyLVRrA8YzzN"); 
export const EAT_PLAYER = new PublicKey("F6rDhVKjVTdGKdxEK9UWfFDcxeT3vFbAckX6U2aWeEKZ"); 
export const JOIN_GAME = new PublicKey("DViN676ajvuWryjWHxk2EF7MvQLgHNqhj4m32p1xLBDB");
export const MOVEMENT = new PublicKey("9rthxrCfneJKfPtv8PQmYk7hGQsUfeyeDKRp3uC4Uwh6");  
export const EXIT_GAME = new PublicKey("wdH5MUvXcyKM58yffCxhRQfB5jLQHpnWZhhdYhLCThf"); 
export const SPAWN_FOOD = new PublicKey("GP3L2w9SP9DASTJoJdTAQFzEZRHprMLaxGovxeMrvMNe"); 
export const INIT_FOOD = new PublicKey("4euz4ceqv5ugh1x6wZP3BsLNZHqBxQwXcK59psw5KeQw");
export const BUY_IN = new PublicKey("CLC46PuyXnSuZGmUrqkFbAh7WwzQm8aBPjSQ3HMP56kp");
export const CASH_OUT = new PublicKey("BAP315i1xoAXqbJcTT1LrUS45N3tAQnNnPuNQkCcvbAr");

export const SOL_USDC_POOL_ID = "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2"; 

export const CONNECTION_STRING = "https://devnet.helius-rpc.com/?api-key=cba33294-aa96-414c-9a26-03d5563aa676";
export const CONNECTION =  new Connection(CONNECTION_STRING); //"https://devnet.helius-rpc.com/?api-key=cba33294-aa96-414c-9a26-03d5563aa676"); 
export const ENDPOINTS = [
  "https://supersize-fra.magicblock.app",
  "https://supersize.magicblock.app",
  "https://supersize-sin.magicblock.app",
];

export const ENDPOINT_TO_WORLD_MAP: Record<string, { worldId: anchor.BN; worldPda: PublicKey }> = {
  "https://supersize-sin.magicblock.app": {
    worldId: new anchor.BN(1355),
    worldPda: new PublicKey('HfKR5HQupLdpnM7EREJPBK3nh13fRpe8ji61ParfTaVv'),
  },
  "https://supersize.magicblock.app": {
    worldId: new anchor.BN(1339),
    worldPda: new PublicKey('2tNAqh9kTgdVYS9eVFacVbAXgiwSL43k7bkJgCByoxky'),
  },
  "https://supersize-fra.magicblock.app": {
    worldId: new anchor.BN(1357),
    worldPda: new PublicKey('6kofJDbfA4DCaX6D7ev2gKa67Ko9C8CioWbp8wdYzyy6'),
  },
};

export const OPTIONS = ["Europe", "America", "Asia"];