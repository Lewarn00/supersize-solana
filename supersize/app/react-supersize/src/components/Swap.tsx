import React, { FC, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, VersionedTransaction } from '@solana/web3.js';
import axios from 'axios';

interface SwapProps {
  quoteMint: string;
  desiredOutputAmount: number;
}
const assets = [
  { name: 'SOL', mint: 'So11111111111111111111111111111111111111112', decimals: 9},
  { name: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6},
  { name: 'BONK', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', decimals: 5 },
  { name: 'WIF', mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', decimals: 6},
];

export const Swap: FC<SwapProps> = ({ quoteMint, desiredOutputAmount }) => {
  const wallet = useWallet();
  const [swapAmount, setSwapAmount] = useState(0);
  
  const connection = new Connection(
    'https://mainnet.helius-rpc.com/?api-key=4fadbb67-634f-49fd-a664-74cf04509e20'
  );
  
  const handleSwap = async () => {
  
    if (!wallet.connected || !wallet.signTransaction) {
      console.error(
        'Wallet is not connected or does not support signing transactions'
      );
      return;
    }

    const response = await axios.get(`https://quote-api.jup.ag/v6/quote?inputMint=${assets[0].mint}&outputMint=${assets[1].mint}&swapMode=ExactOut&amount=${desiredOutputAmount * 10 ** assets[1].decimals}`)
  
    console.log(response.data);

    const swapTransactionRequest = await axios.post("https://quote-api.jup.ag/v6/swap", {
      quoteResponse: response.data,
      userPublicKey: wallet.publicKey?.toString(),
      wrapAndUnwrapSol: true,
    })    

    const {swapTransaction} = swapTransactionRequest.data;

    try {
      const swapTransactionBuffer = Buffer.from(swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuffer);
      const signedTransaction = await wallet.signTransaction(transaction);

      const rawTransaction = signedTransaction.serialize();
      const txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 2,
      });

      const latestBlockHash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: txid
      }, 'confirmed');

      console.log(`https://solscan.io/tx/${txid}`);
    }catch(err) {
      console.log(err);
    }

  };

  return (
    <button 
  onClick={handleSwap}
  disabled={!wallet.connected}
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 40px",
    backgroundColor: "white",
    color: "black",
    border: "none",
    borderRadius: "10px", // More rounded corners
    cursor: wallet.connected ? "pointer" : "not-allowed",
    transition: "all 0.2s ease",
    fontWeight: "600",
    fontSize: "16px",
    letterSpacing: "0.5px",
    opacity: wallet.connected ? 1 : 0.7,
    transform: "scale(1)",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  }}
>
  <span>Buy {desiredOutputAmount} USDC</span>
</button>
  );
};
