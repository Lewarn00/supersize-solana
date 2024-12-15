import * as anchor from "@coral-xyz/anchor";
import useSupersize from "@hooks/useSupersize";
import { Commitment, PublicKey, Transaction } from "@solana/web3.js";
import { ActiveGame, Blob, Food } from "@utils/types";
import {
    createContext,
    PropsWithChildren,
    SetStateAction,
    useContext,
    Dispatch,
    MutableRefObject,
} from "react";

const SupersizeContext = createContext<
    | {
        newGameTx: (
            game_size: number,
            max_buyin: number,
            min_buyin: number,
            game_owner_wallet_string: string,
            game_token_string: string,
            game_name: string,
        ) => Promise<void>;
        selectedOption: string;
        handleOptionClick: (option: any) => void;
        leaderBoardOptions: React.MutableRefObject<
            {
                icon: string;
                name: string;
            }[]
        >;
        season: {
            icon: string;
            name: string;
        };
        setSeason: React.Dispatch<
            React.SetStateAction<{
                icon: string;
                name: string;
            }>
        >;
        referrer: string;
        username: string;
        setUsername: Dispatch<SetStateAction<string>>;
        setInputUsername: (inputUsername: any) => void;
        isReferrerModalOpen: boolean;
        setIsReferrerModalOpen: Dispatch<SetStateAction<boolean>>;
        referrerInput: string;
        setReferrerInput: Dispatch<SetStateAction<string>>;
        currentTPS: number;
        price: number;
        gameId: anchor.web3.PublicKey | null;
        gameEnded: number;
        playerExiting: boolean;
        countdown: number;
        screenSize: {
            width: number;
            height: number;
        };
        reclaimTx: string | null;
        cashoutTx: string | null;
        handleExitClick: () => void;
        players: Blob[];
        visibleFood: Food[][];
        currentPlayer: Blob | null;
        buyIn: number;
        setBuyIn: Dispatch<SetStateAction<number>>;
        playerName: string;
        setPlayerName: Dispatch<SetStateAction<string>>;
        activeGames: ActiveGame[];
        setActiveGames: Dispatch<SetStateAction<ActiveGame[]>>;
        openGameInfo: boolean[];
        setOpenGameInfo: Dispatch<SetStateAction<boolean[]>>;
        inputValue: string;
        setInputValue: Dispatch<SetStateAction<string>>;
        joinGameTx: (selectGameId: ActiveGame) => Promise<void>;
        isSubmitting: boolean;
        isJoining: boolean;
        transactionError: string | null;
        setTransactionError: Dispatch<SetStateAction<string | null>>;
        transactionSuccess: string | null;
        setTransactionSuccess: Dispatch<SetStateAction<string | null>>;
        setNewGameCreated: Dispatch<SetStateAction<ActiveGame | null>>;
        cleanUp: () => Promise<void>;
    }
    | undefined
>(undefined);

export const SupersizeProvider = ({ children }: PropsWithChildren) => {
    const value = useSupersize();
    return (
        <SupersizeContext.Provider value={value}>
            {children}
        </SupersizeContext.Provider>
    );
};

export const useSupersizeContext = () => {
    const context = useContext(SupersizeContext);
    if (!context) {
        throw new Error(
            "useSupersizeContext must be used within a SupersizeProvider",
        );
    }
    return context;
};
