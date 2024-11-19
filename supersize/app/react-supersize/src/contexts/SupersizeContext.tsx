import React, { createContext, useContext, PropsWithChildren } from "react";
import useSupersize from "../hooks/useSupersize";
import { Keypair, PublicKey } from "@solana/web3.js";
import { ActiveGame, Blob } from "@utils/types";

const SupersizeContext = createContext<
    | {
        savedPublicKey: PublicKey | null,
        wallet: Keypair,
        fastestEndpoint: string | null,
        playerKey: PublicKey,
        walletRef: React.MutableRefObject<Keypair>,
        foodwallet: Keypair,
        foodKey: PublicKey,
        foodwalletRef: React.MutableRefObject<Keypair>,
        players: Blob[],
        selectedOption: string,
        buyIn: number,
        activeGames: ActiveGame[],
    }
    | undefined
>(undefined);

export const SupersizeProvider = ({children}: PropsWithChildren) => {
    const value = useSupersize();
    return <SupersizeContext.Provider value={value}>{children}</SupersizeContext.Provider>;
};

export const useSupersizeContext = () => {
    const context = useContext(SupersizeContext);
    if (!context) {
        throw new Error("useSupersizeContext must be used within a SupersizeProvider");
    }

    return context;
};
