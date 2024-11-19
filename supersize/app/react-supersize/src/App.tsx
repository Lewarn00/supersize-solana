import React, {useMemo} from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes";
import { SupersizeProvider } from "./contexts/SupersizeContext";
import { Toaster } from "react-hot-toast";
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import {PhantomWalletAdapter, SolflareWalletAdapter} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider, } from '@solana/wallet-adapter-react-ui';
import { CONNECTION_STRING } from "./utils/constants";

require('@solana/wallet-adapter-react-ui/styles.css');

const App = () => {

    const wallets = useMemo(() => [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
    ], []);

  return (
    <BrowserRouter>
        <ConnectionProvider endpoint={CONNECTION_STRING}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <SupersizeProvider>
                        <AppRoutes />
                        <Toaster />
                    </SupersizeProvider>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    </BrowserRouter>
  );
};

export default App;
