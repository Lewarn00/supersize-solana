import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';

export interface Food {
    x: number;
    y: number;
}

export interface Blob {
    name: string;
    authority: PublicKey | null;
    x: number;
    y: number;
    radius: number;
    mass: number;
    score: number;
    tax: number;
    speed: number;
    removal: BN;
    target_x: number;
    target_y: number;
}

export type ActiveGame = {
    worldPda: PublicKey;
    worldId: BN;
    name: string;
    active_players: number;
    max_players: number;
    size: number;
};