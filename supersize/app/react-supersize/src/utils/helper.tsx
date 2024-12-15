import { API_BASE_URL } from "@utils/constants";
import { PublicKey, Keypair, Transaction } from "@solana/web3.js";
import * as crypto from "crypto-js";
import * as anchor from "@coral-xyz/anchor";

export const deriveSeedFromPublicKey = (
    userPublicKey: PublicKey,
): Uint8Array => {
    const salt = "supersizeSalt";
    const hash = crypto.SHA256(userPublicKey.toBuffer().toString() + salt);
    const hashArray = new Uint8Array(
        Buffer.from(hash.toString(crypto.enc.Hex), "hex"),
    );
    return hashArray.slice(0, 32);
};

export const deriveKeypairFromPublicKey = (
    userPublicKey: PublicKey,
): Keypair => {
    const seed = deriveSeedFromPublicKey(userPublicKey);
    const keypair = Keypair.fromSeed(seed);
    return keypair;
};

export const updateWins = async (
    walletAddress: string,
    updateId: number,
    amount: number,
) => {
    const response = await fetch(`${API_BASE_URL}/updateWins`, {
        method: "POST",
        body: JSON.stringify({ walletAddress, updateId, amount }),
    });

    const resData = await response.json();
    if (!resData.success) {
        throw new Error("Failed to update wins");
    }
    return resData;
};

export const getTopLeftCorner = (
    index: number,
    mapSize: number,
): { x: number; y: number } => {
    const sectionSize = 1000;
    const sectionsPerRow = mapSize / sectionSize;
    const mapSectionCount = sectionsPerRow * sectionsPerRow;
    const wrappedIndex = index % mapSectionCount;
    const row = Math.floor(wrappedIndex / sectionsPerRow);
    const col = wrappedIndex % sectionsPerRow;
    const x = col * sectionSize;
    const y = row * sectionSize;

    return { x, y };
};

export const pingEndpoint = async (url: string): Promise<number> => {
    const startTime = performance.now();
    try {
        await fetch(url, { method: "HEAD" });
    } catch (error) {
        console.error(`Failed to ping ${url}:`, error);
    }
    const endTime = performance.now();
    return endTime - startTime;
};

export const checkTransactionStatus = async (
    connection: anchor.web3.Connection,
    signature: string,
): Promise<boolean> => {
    try {
        const status = await connection.getSignatureStatus(signature, {
            searchTransactionHistory: true,
        });
        if (
            status &&
            status.value &&
            status.value.confirmationStatus === "confirmed" &&
            status.value.err === null
        ) {
            //console.log("Transaction succeeded:", signature);
            return true;
        } else {
            console.warn("Transaction still pending or failed:", signature);
            return false;
        }
    } catch (error) {
        console.error("Error checking transaction status:", error);
        return false;
    }
};

export const waitSignatureConfirmation = async (
    signature: string,
    connection: anchor.web3.Connection,
    commitment: anchor.web3.Commitment,
): Promise<void> => {
    return new Promise((resolve, reject) => {
        connection.onSignature(
            signature,
            (result) => {
                if (result.err) {
                    //console.error(`Error with signature ${signature}`, result.err);
                    reject(result.err);
                } else {
                    setTimeout(() => resolve(), 1000);
                }
            },
            commitment,
        );
    });
};

export async function getPriorityFeeEstimate(
    priorityLevel: string,
    publicKeys: string[],
) {
    const response = await fetch(
        "https://mainnet.helius-rpc.com/?api-key=cba33294-aa96-414c-9a26-03d5563aa676",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: "helius-example",
                method: "getPriorityFeeEstimate",
                params: [
                    {
                        accountKeys: publicKeys,
                        options: {
                            recommended: true,
                        },
                    },
                ],
            }),
        },
    );
    const data = await response.json();
    console.log(
        "Fee in function for",
        priorityLevel,
        " :",
        data.result.priorityFeeEstimate,
    );
    return data.result;
}
