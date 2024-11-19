import { useCallback, useRef, useState, useEffect, useMemo } from "react";
import { PublicKey, Keypair } from "@solana/web3.js";
import { CONNECTION, ENDPOINTS, OPTIONS, pingEndpoint, Blob, ActiveGame, ENDPOINT_TO_WORLD_MAP } from "../utils";
import * as anchor from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

export const useSupersize = () => {
    const [savedPublicKey, setSavedPublicKey] = useState<PublicKey | null>(null);
    const [wallet, setWallet] = useState<Keypair>(() => Keypair.generate());
    const [fastestEndpoint, setFastestEndpoint] = useState<string | null>(null);
    const [playerKey, setPlayerKey] = useState<PublicKey>(wallet.publicKey);
    const walletRef = useRef<Keypair>(wallet);

    const [foodwallet] = useState<Keypair>(() => Keypair.generate());
    const [foodKey, setFoodKey] = useState<PublicKey>(foodwallet.publicKey);
    const foodwalletRef = useRef<Keypair>(foodwallet);
    const [players, setPlayers] = useState<Blob[]>([]);
    const [selectedOption, setSelectedOption] = useState(OPTIONS[0]);
    const [buyIn, setBuyIn] = useState(1.0); 
    const [activeGames, setActiveGames] = useState<ActiveGame[]>([]);

    useEffect(() => {
        const checkEndpoints = async () => {
            const results: Record<string, number> = {};
            for (const endpoint of ENDPOINTS) {
                const pingTime = await pingEndpoint(endpoint);
                results[endpoint] = pingTime;
            }

            const lowestPingEndpoint = Object.keys(results).reduce((a, b) => (results[a] < results[b] ? a : b));
            setFastestEndpoint(lowestPingEndpoint);
            const index = ENDPOINTS.indexOf(lowestPingEndpoint);
            if (index !== -1) {
                setSelectedOption(OPTIONS[index]);
            }
            const wsUrl = lowestPingEndpoint.replace("https", "wss");
        };
        checkEndpoints();
    }, []);

    useEffect(() => {
        if (buyIn > 10) {
            setBuyIn(10.0); 
        }
        if (buyIn < 0.1){
            setBuyIn(0.1);
        }
    }, [buyIn]);
    
    useEffect(() => {
        if (fastestEndpoint) {
            const { worldId, worldPda } = ENDPOINT_TO_WORLD_MAP[fastestEndpoint];
            setActiveGames([{ worldId: worldId, worldPda: worldPda} as ActiveGame]);
        }
    }, [fastestEndpoint]);

    return {
        savedPublicKey,
        wallet,
        fastestEndpoint,
        playerKey,
        walletRef,
        foodwallet,
        foodKey,
        foodwalletRef,
        players,
        selectedOption,
        buyIn,
        activeGames,
    }
};

export default useSupersize;