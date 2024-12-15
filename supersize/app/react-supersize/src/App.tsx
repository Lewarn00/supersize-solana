import React, { useMemo } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes";
import {
    ConnectionProvider,
    WalletProvider,
} from "@solana/wallet-adapter-react";
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { CONNECTION_STRING } from "@utils/constants";
import { SupersizeProvider } from "@contexts/SupersizeContext";
import {useConnection, useWallet} from '@solana/wallet-adapter-react';
import {Connection} from "@solana/web3.js";
import { initBuddyState, initialBuddyLink, useInitBuddyLink,
    useBuddyState, useBuddyLink, BUDDY_STATUS, getTreasuryPDA, getBuddyPDA,
    BUDDY_MINTS, getMemberPDA
 } from "buddy.link";
 
require("@solana/wallet-adapter-react-ui/styles.css");

const initialState = {
    [BUDDY_MINTS]: [
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",  // USDC on mainnet
      "11111111111111111111111111111111"               // SOL on mainnet
    ],
  }

initBuddyState({ ...initialBuddyLink, 
    ...initialState, 
}); 

const InitBuddyLinkWrapper = () => {
    //const { connection } = useConnection()
    const  connection =  new Connection("https://floral-convincing-dawn.solana-mainnet.quiknode.pro/73d5d52678fd227b48dd0aec6a8e94ac9dd61f59"); 

    const wallet = useWallet()

    // Note: Devnet SDK has an error that Wagg is fixing, contact him to find out when this can be removed
    const organization = 'supersize';

    useInitBuddyLink(connection as any, wallet, organization, { debug: true });

    return null
}

function App() {
    const wallets = useMemo(
        () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
        [],
    );

    return (
        <>
        <ConnectionProvider endpoint={CONNECTION_STRING}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <BrowserRouter>
                        <SupersizeProvider>
                            <AppRoutes />
                        </SupersizeProvider>
                        <InitBuddyLinkWrapper />
                    </BrowserRouter>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
        </>
    );
}

export default App;
