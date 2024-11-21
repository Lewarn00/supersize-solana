import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "./components/Button";
import CreateGame from "./components/CreateGame";
import GameComponent from "./components/GameComponent";
import CreateGameComponent from "./components/CreateGameComponent";
import Alert from "./components/Alert";
import "./output.css";

import {
    AddEntity,
    ApplySystem,
    createApplyInstruction,
    createInitializeComponentInstruction,
    FindComponentPda,
    FindWorldPda,
    FindEntityPda,
    createAddEntityInstruction,
    createInitializeRegistryInstruction,
    FindRegistryPda,
    InitializeNewWorld,
    InitializeComponent,
    createDelegateInstruction,
    DELEGATION_PROGRAM_ID,
    createAllowUndelegationInstruction,
    createUndelegateInstruction,
} from "@magicblock-labs/bolt-sdk";

import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
    Connection,
    SYSVAR_RENT_PUBKEY,
    clusterApiUrl,
    Keypair,
    LAMPORTS_PER_SOL,
    Transaction,
    sendAndConfirmTransaction,
    SystemProgram,
    SystemInstruction,
    AccountInfo,
    Commitment,
    ComputeBudgetProgram,
    PublicKey
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Idl, Program, Provider, Wallet, AnchorProvider } from "@coral-xyz/anchor";
import { SimpleProvider } from "./components/Wallet";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import BN from 'bn.js';
import * as splToken from '@solana/spl-token';
import {
    getAccount,
    getOrCreateAssociatedTokenAccount,
    createAssociatedTokenAccountInstruction,
    createAssociatedTokenAccount,
    createTransferInstruction,
    createCloseAccountInstruction,
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { LIQUIDITY_STATE_LAYOUT_V4 } from "@raydium-io/raydium-sdk";
import { set } from "@metaplex-foundation/beet";
import * as crypto from 'crypto-js';
import Navbar from "./components/AppComps/Navbar";
import HeroSection from "./components/AppComps/HeroSection";
import Info from "./components/AppComps/Info";
import Footer from "./components/AppComps/Footer";
import GameWrapper from "./components/AppComps/GameWrapper";

const bs58 = require('bs58');

const FOOD_COMPONENT = new PublicKey("BEox2GnPkZ1upBAdUi7FVqTstjsC4tDjsbTpTiE17bah");
const MAP_COMPONENT = new PublicKey("2dZ5DLJhEVFRA5xRnRD779ojsWsf3HMi6YB1zmVDdsYb");
const PLAYER_COMPONENT = new PublicKey("2ewyq31Atu7yLcYMg51CEa22HmcCSJwM4jjHH8kKVAJw");
const ANTEROOM_COMPONENT = new PublicKey("EbGkJPaMY8XCJCNjkWwk971xzE32X5LBPg5s2g4LDYcW");

const INIT_ANTEROOM = new PublicKey("AxmRc9buNLgWVMinrH2WunSxKmdsBXVCghhYZgh2hJT6");
const INIT_GAME = new PublicKey("NrQkd31YsAWX6qyuLgktt4VPG4Q2DY94rBq7fWdRgo7");
const EAT_FOOD = new PublicKey("EdLga9mFADH4EjPY6RsG1LF7w8utVuWDgyLVRrA8YzzN");
const EAT_PLAYER = new PublicKey("F6rDhVKjVTdGKdxEK9UWfFDcxeT3vFbAckX6U2aWeEKZ");
const JOIN_GAME = new PublicKey("DViN676ajvuWryjWHxk2EF7MvQLgHNqhj4m32p1xLBDB");
const MOVEMENT = new PublicKey("9rthxrCfneJKfPtv8PQmYk7hGQsUfeyeDKRp3uC4Uwh6");
const EXIT_GAME = new PublicKey("wdH5MUvXcyKM58yffCxhRQfB5jLQHpnWZhhdYhLCThf");
const SPAWN_FOOD = new PublicKey("GP3L2w9SP9DASTJoJdTAQFzEZRHprMLaxGovxeMrvMNe");
const INIT_FOOD = new PublicKey("4euz4ceqv5ugh1x6wZP3BsLNZHqBxQwXcK59psw5KeQw");
const BUY_IN = new PublicKey("CLC46PuyXnSuZGmUrqkFbAh7WwzQm8aBPjSQ3HMP56kp");
const CASH_OUT = new PublicKey("BAP315i1xoAXqbJcTT1LrUS45N3tAQnNnPuNQkCcvbAr");

interface Food {
    x: number;
    y: number;
}
interface Blob {
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

type ActiveGame = {
    worldPda: PublicKey;
    worldId: BN;
    name: string;
    active_players: number;
    max_players: number;
    size: number;
    image: string;
    token: string;
};

const App: React.FC = () => {
    //let { connection } =  useConnection();
    const connection = new Connection("https://devnet.helius-rpc.com/?api-key=cba33294-aa96-414c-9a26-03d5563aa676");
    //const  connection =  new Connection("https://staked.helius-rpc.com?api-key=cba33294-aa96-414c-9a26-03d5563aa676"); 
    const { publicKey, sendTransaction } = useWallet();
    let userKey = publicKey;
    const [savedPublicKey, setSavedPublicKey] = useState<PublicKey | null>(null);
    const [exitTxn, setExitTxn] = useState<string>('');
    const endpoints = [
        "https://supersize-fra.magicblock.app",
        "https://supersize.magicblock.app",
        "https://supersize-sin.magicblock.app",
    ];
    /*
    const endpoints = [
      "https://supersize-mainnet.magicblock.app",
      "https://supersize-mainnet-bos.magicblock.app",
      "https://supersize-mainnet-sin.magicblock.app",
    ];*/

    const [fastestEndpoint, setFastestEndpoint] = useState<string | null>(null);
    const [enpointDone, setEndpointDone] = useState<boolean>(false);
    //const [wallet] = useState<Keypair>(() => Keypair.generate());
    const [wallet, setWallet] = useState<Keypair>(Keypair.generate());
    const [playerKey, setPlayerKey] = useState<PublicKey>(wallet.publicKey);
    const walletRef = useRef<Keypair>(wallet);
    const [foodwallet] = useState<Keypair>(() => Keypair.generate());
    const [foodKey, setFoodKey] = useState<PublicKey>(foodwallet.publicKey);
    const foodwalletRef = useRef<Keypair>(foodwallet);
    const [players, setPlayers] = useState<Blob[]>([]);
    const [playersLists, setPlayersLists] = useState<PublicKey[][]>([]);
    const [playersListsLen, setPlayersListsLen] = useState<number[]>([]);
    const [allplayers, setAllPlayers] = useState<Blob[]>([]);
    const [leaderboard, setLeaderboard] = useState<Blob[]>([]);
    const [foodListLen, setFoodListLen] = useState<number[]>([]);
    const [allFood, setAllFood] = useState<Food[][]>([]);
    const [visibleFood, setVisibleFood] = useState<Food[][]>([]);
    const [currentPlayer, setCurrentPlayer] = useState<Blob | null>(null);
    const [playerName, setPlayerName] = useState("unnamed");
    const [expandlist, setexpandlist] = useState(false);
    const [subscribedToGame, setSubscribedToGame] = useState(false);
    const [newGameCreated, setNewGameCreated] = useState<ActiveGame | null>(null);
    const [currentTPS, setCurrentTPS] = useState(0);
    const [price, setPrice] = useState(0);
    const scale = 1;
    const [screenSize, setScreenSize] = useState({ width: 2000, height: 2000 });
    const [mapSize, setMapSize] = useState(4000);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isJoining, setIsJoining] = useState<boolean>(false);
    const [moveSignature, setMoveSignature] = useState<string | null>(null);
    const [transactionError, setTransactionError] = useState<string | null>(null);
    const [transactionSuccess, setTransactionSuccess] = useState<string | null>(null);
    /* const endpointToWorldMap: Record<string, { worldId: anchor.BN; worldPda: PublicKey }> = {
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
      };*/

    const endpointToWorldMap: Record<string, { worldId: anchor.BN; worldPda: PublicKey }> = {
        "https://supersize-sin.magicblock.app": {
            worldId: new anchor.BN(1646),
            worldPda: new PublicKey('5ruXTp8pWoiat5QQTr2NeQa5381btFTpwvSxhxUZf3xS'),
        },
        "https://supersize.magicblock.app": {
            worldId: new anchor.BN(1645),
            worldPda: new PublicKey('F7tPww5apcPt2CbBdjqmkvDZXQT8k5rbz62UrZYa7z9o'),
        },
        "https://supersize-fra.magicblock.app": {
            worldId: new anchor.BN(1642),
            worldPda: new PublicKey('618CRNGjU2GYqaZKuVGWteDzzX4VpzLFTb15Ts3bCwfk'),
        },
    };
    const [activeGames, setActiveGames] = useState<ActiveGame[]>([]);
    const [gamewallet, setGameWallet] = useState("");
    const [openGameInfo, setOpenGameInfo] = useState<boolean[]>(new Array(activeGames.length).fill(false));
    let entityMatch = useRef<PublicKey | null>(null);
    let playerEntities = useRef<PublicKey[]>([]);
    let foodEntities = useRef<PublicKey[]>([]);
    let currentPlayerEntity = useRef<PublicKey | null>(null);
    let currentWorldId = useRef<PublicKey | null>(null);
    let anteroomEntity = useRef<PublicKey | null>(null);
    const [gameId, setGameId] = useState<PublicKey | null>(null);

    const [exitHovered, setExitHovered] = useState(false);

    let playersComponentSubscriptionId = useRef<number[] | null>([]);
    let foodComponentSubscriptionId = useRef<number[] | null>([]);
    let myplayerComponentSubscriptionId = useRef<number | null>(null);
    let mapComponentSubscriptionId = useRef<number | null>(null);

    const playersComponentClient = useRef<Program | null>(null);
    const mapComponentClient = useRef<Program | null>(null);
    const foodComponentClient = useRef<Program | null>(null);

    const [isMouseDown, setIsMouseDown] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const [panelContent, setPanelContent] = useState<JSX.Element | null>(null);
    const [buildViewerNumber, setbuildViewerNumber] = useState(0);
    const [isHovered, setIsHovered] = useState([false, false, false, false, false, false]);

    const [gameEnded, setGameEnded] = useState(0);
    const [playerCashout, setPlayerCashout] = useState(0);
    const [playerTax, setPlayerTax] = useState(0);
    const playerRemovalTimeRef = useRef<BN | null>(null);
    const [cashoutTx, setCashoutTx] = useState<string | null>(null);
    const [reclaimTx, setReclaimTx] = useState<string | null>(null);
    const [cashingOut, setCashingOut] = useState<boolean>(false);
    const [playerCashoutAddy, setPlayerCashoutAddy] = useState<PublicKey | null>(null);
    const nextFood = useRef({ x: -1, y: -1 });

    const [inputValue, setInputValue] = useState<string>('');
    const [footerVisible, setFooterVisible] = useState(false);
    const [playerExiting, setPlayerExiting] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [buyIn, setBuyIn] = useState(1.0);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 1000);
    const [selectedOption, setSelectedOption] = useState("Europe");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const options = ["Europe", "America", "Asia"];

    const SOL_USDC_POOL_ID = "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2";

    let provider = new anchor.AnchorProvider(
        connection,
        new NodeWallet(wallet),
        {
            preflightCommitment: 'processed',
            commitment: 'processed',
        }
    );

    /*const providerEphemeralRollup = useRef<anchor.AnchorProvider>(new anchor.AnchorProvider(
        new anchor.web3.Connection("https://supersize-mainnet-sin.magicblock.app", {
        wsEndpoint: "wss://supersize-mainnet-sin.magicblock.app",
        }),
        new NodeWallet(wallet) 
    ));*/

    const providerEphemeralRollup = useRef<anchor.AnchorProvider>(new anchor.AnchorProvider(
        new anchor.web3.Connection("https://supersize-fra.magicblock.app", {
            wsEndpoint: "wss://supersize-fra.magicblock.app",
        }),
        new NodeWallet(wallet)
    ));

    anchor.setProvider(provider);

    useEffect(() => {
        if (publicKey) {
            const newWallet = deriveKeypairFromPublicKey(publicKey);
            setWallet(newWallet);
            setPlayerKey(newWallet.publicKey);
            walletRef.current = newWallet;
            if (fastestEndpoint) {
                const wsUrl = fastestEndpoint.replace("https", "wss");
                providerEphemeralRollup.current = new anchor.AnchorProvider(
                    new anchor.web3.Connection(fastestEndpoint, {
                        wsEndpoint: wsUrl,
                    }),
                    new NodeWallet(newWallet)
                );
                provider = new anchor.AnchorProvider(
                    connection,
                    new NodeWallet(newWallet),
                    {
                        preflightCommitment: 'processed',
                        commitment: 'processed',
                    }
                );
            }
            console.log(newWallet, playerKey.toString());
        }
    }, [publicKey, savedPublicKey]);

    useEffect(() => {
        if (publicKey) {
            setSavedPublicKey(publicKey);
        }
    }, [publicKey]);

    function deriveSeedFromPublicKey(userPublicKey: PublicKey): Uint8Array {
        const salt = 'supersizeSalt';
        const hash = crypto.SHA256(userPublicKey.toBuffer().toString() + salt);
        const hashArray = new Uint8Array(Buffer.from(hash.toString(crypto.enc.Hex), 'hex'));
        return hashArray.slice(0, 32);
    }

    function deriveKeypairFromPublicKey(userPublicKey: PublicKey): Keypair {
        const seed = deriveSeedFromPublicKey(userPublicKey);
        const keypair = Keypair.fromSeed(seed);
        return keypair;
    }

    const handleOptionClick = (option: any) => {
        setSelectedOption(option);
        setIsDropdownOpen(false);
        const selectedIndex = options.indexOf(option);
        setFastestEndpoint(endpoints[selectedIndex]);
    };

    const pingEndpoint = async (url: string): Promise<number> => {
        const startTime = performance.now();
        try {
            await fetch(url, { method: "HEAD" });
        } catch (error) {
            console.error(`Failed to ping ${url}:`, error);
        }
        const endTime = performance.now();
        return endTime - startTime;
    };

    useEffect(() => {
        const checkEndpoints = async () => {
            const results: Record<string, number> = {};
            setEndpointDone(false);
            for (const endpoint of endpoints) {
                const pingTime = await pingEndpoint(endpoint);
                results[endpoint] = pingTime;
            }

            const lowestPingEndpoint = Object.keys(results).reduce((a, b) => (results[a] < results[b] ? a : b));
            setFastestEndpoint(lowestPingEndpoint);
            const index = endpoints.indexOf(lowestPingEndpoint);
            if (index !== -1) {
                setSelectedOption(options[index]);
            }
            const wsUrl = lowestPingEndpoint.replace("https", "wss");
        };

        checkEndpoints();
    }, []);

    useEffect(() => {
        if (buyIn > 10) {
            setBuyIn(10.0);
        }
        if (buyIn < 0.1) {
            setBuyIn(0.1);
        }
    }, [buyIn]);

    useEffect(() => {
        if (fastestEndpoint) {
            const wsUrl = fastestEndpoint.replace("https", "wss");
            providerEphemeralRollup.current = new anchor.AnchorProvider(
                new anchor.web3.Connection(fastestEndpoint, {
                    wsEndpoint: wsUrl,
                }),
                new NodeWallet(wallet)
            );

            console.log('Updated providerEphemeralRollup:', providerEphemeralRollup.current);
            const { worldId, worldPda } = endpointToWorldMap[fastestEndpoint];
            //setActiveGames([{ worldId: worldId, worldPda: worldPda} as ActiveGame]);
            const newGameInfo: ActiveGame = { worldId: worldId, worldPda: worldPda, name: "loading", active_players: 0, max_players: 0, size: 0, image: `${process.env.PUBLIC_URL}/token.png`, token: "LOADING" }
            //setNewGameCreated(newGameInfo);
            setActiveGames([newGameInfo]);
            fetchAndLogMapData();
            setOpenGameInfo(new Array(activeGames.length).fill(false));
            setEndpointDone(true);
            console.log(fastestEndpoint);
        }
    }, [fastestEndpoint]);

    const openDocs = useCallback(() => {
        window.open('https://docs.supersize.gg/', '_blank');
    }, []);
    const openX = useCallback(() => {
        window.open('https://x.com/SUPERSIZEgg', '_blank');
    }, []);
    const openTG = useCallback(() => {
        window.open('https://t.me/supersizeplayers', '_blank');
    }, []);

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPlayerName(event.target.value);
    };
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(event.target.value);
    };
    const handleSliderChange = (event: any) => {
        let value = parseFloat(event.target.value);
        value = value > 10 ? 10 : value;
        value = value > 0.1 ? parseFloat(value.toFixed(1)) : value;
        setBuyIn(value);
    };

    const getComponentsClientBasic = useCallback(async (component: PublicKey): Promise<Program> => {
        const idl = await Program.fetchIdl(component);
        if (!idl) throw new Error('IDL not found');
        return new Program(idl, provider);
    }, [provider]);

    const getComponentsClient = useCallback(async (component: PublicKey): Promise<Program> => {
        const idl = await Program.fetchIdl(component);
        if (!idl) throw new Error('IDL not found');
        return new Program(idl, providerEphemeralRollup.current);
    }, [providerEphemeralRollup.current]);

    const updateFoodList = useCallback((section: any, food_index: number) => {
        const foodArray = section.food as any[];
        const visibleFood: Food[] = [];
        const foodData: Food[] = [];
        foodArray.forEach((foodItem) => {
            foodData.push({ x: foodItem.x, y: foodItem.y });
            if (currentPlayer) {
                const halfWidth = screenSize.width / 2;
                const halfHeight = screenSize.height / 2;
                const diffX = (foodItem.x - currentPlayer.x);
                const diffY = (foodItem.y - currentPlayer.y);
                if (Math.abs(diffX) <= halfWidth && Math.abs(diffY) <= halfHeight) {
                    visibleFood.push({
                        x: diffX + screenSize.width / 2,
                        y: diffY + screenSize.height / 2
                    } as Food);
                }
            }
        });
        if (foodData.length > 0) {
            setAllFood((prevAllFood) => {
                return prevAllFood.map((foodArray, index) =>
                    food_index === index ? foodData : foodArray
                );
            });
            setFoodListLen((prevFoodListLen) => {
                const updatedFoodListLen = [...prevFoodListLen];
                updatedFoodListLen[food_index] = foodData.length;
                return updatedFoodListLen;
            });
        }
    }, [setAllFood, screenSize, currentPlayer]);

    const updateLeaderboard = useCallback((players: any[]) => {
        const top10Players = players
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map(player => ({
                name: player.name,
                authority: player.authority,
                x: player.x,
                y: player.y,
                radius: 4 + Math.sqrt(player.mass / 10) * 6,
                mass: player.mass,
                score: player.score,
                tax: player.tax,
                speed: player.speed,
                removal: player.scheduledRemovalTime,
                target_x: player.target_x,
                target_y: player.target_y,
            }));
        setLeaderboard(top10Players);

        if (currentPlayer) {
            const sortedPlayers = players
                .sort((a, b) => b.score - a.score);
            const currentPlayerRank = sortedPlayers.findIndex(
                player => player.authority.equals(currentPlayer.authority)
            );
        }
    }, [setLeaderboard, playerKey]);

    useEffect(() => {
        let status: string = '<span class="title">Leaderboard</span>';
        for (let i = 0; i < leaderboard.length; i++) {
            status += '<br />';
            const currentItem = leaderboard[i];
            if (currentPlayer && currentItem && currentItem.authority && currentPlayer.authority) {
                if (currentItem.authority.equals(currentPlayer.authority)) {
                    status += '<span class="me">' + (i + 1) + '. ' + currentItem.name + "</span>";
                } else {
                    status += (i + 1) + '. ' + currentItem.name;
                }
            } else {
                status += (i + 1) + '. ' + currentItem.name;
            }
        }
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.innerHTML = status;
        }
    }, [setLeaderboard, leaderboard]);


    const updateMyPlayerCashout = useCallback((player: any) => {
        console.log('updating cashout data', player);
        setPlayerCashout(player.score);
        setPlayerTax(player.tax);
        setPlayerCashoutAddy(player.payoutTokenAccount)
    }, [setCurrentPlayer, playerKey, allFood]);

    const updateMyPlayer = useCallback((player: any) => {
        if (player.scheduledRemovalTime) {
            playerRemovalTimeRef.current = player.scheduledRemovalTime;
        }
        if (Math.sqrt(player.mass) == 0 &&
            player.x === 50000 &&
            player.y === 50000 &&
            player.score == 0.0 &&
            !cashingOut) {
            setGameEnded(1);
            setGameId(null);
        }
        setCurrentPlayer({
            name: player.name,
            authority: player.authority,
            x: player.x,
            y: player.y,
            radius: 4 + Math.sqrt(player.mass / 10) * 6,
            mass: player.mass,
            score: player.score,
            tax: player.tax,
            speed: player.speed,
            removal: player.scheduledRemovalTime,
            target_x: player.targetX,
            target_y: player.targetY,
        } as Blob);

        if (Math.sqrt(player.mass) == 0 &&
            player.x === 50000 &&
            player.y === 50000 &&
            player.score != 0.0
        ) {
            setCashingOut(true);
            setGameEnded(2);
            setGameId(null);
        }
    }, [setCurrentPlayer, playerKey, allFood]);

    useEffect(() => {
        if (currentPlayer) {
            const playersWithAuthority = allplayers.filter(
                (player) =>
                    player.authority !== null &&
                    player.x !== 50000 &&
                    player.y !== 50000 &&
                    Math.sqrt(player.mass) !== 0
            );
            updateLeaderboard(playersWithAuthority);
            const newVisiblePlayers: Blob[] = playersWithAuthority.reduce((accumulator: Blob[], playerx) => {
                if (currentPlayer && playerx.authority && currentPlayer.authority) {
                    if (currentPlayer.authority.toString() != playerx.authority.toString()) {
                        const halfWidth = screenSize.width / 2;
                        const halfHeight = screenSize.height / 2;
                        const diffX = (playerx.x - currentPlayer.x);
                        const diffY = (playerx.y - currentPlayer.y);

                        if (Math.abs(diffX) <= halfWidth && Math.abs(diffY) <= halfHeight) {
                            accumulator.push({
                                name: playerx.name,
                                authority: playerx.authority,
                                x: diffX + screenSize.width / 2,
                                y: diffY + screenSize.height / 2,
                                radius: 4 + Math.sqrt(playerx.mass / 10) * 6,
                                mass: playerx.mass,
                                score: playerx.score,
                                tax: playerx.tax,
                                speed: playerx.speed,
                                removal: playerx.removal,
                                target_x: playerx.target_x,
                                target_y: playerx.target_y,
                            });
                        }
                    }
                }
                return accumulator;
            }, []);
            setPlayers(newVisiblePlayers);
        }
    }, [currentPlayer, allplayers]);

    const updateMap = useCallback((map: any) => {
        const playerArray = map.players as any[];
        //console.log(map); 
        if (map.nextFood) {
            if (map.nextFood.x !== nextFood.current.x || map.nextFood.y !== nextFood.current.y) {
                //console.log('new food', map.nextFood, nextFood.current);
                nextFood.current = { x: map.nextFood.x, y: map.nextFood.y };
                //processNewFoodTransaction(map.nextFood.x, map.nextFood.y);
            }
        } else if (map.foodQueue > 0) {
            nextFood.current = { x: 0, y: 0 };
            //console.log('new food', map.foodQueue);
            //processNewFoodTransaction(0, 0);
        }
    }, [setPlayers, setCurrentPlayer, playerKey, allFood]);

    const updatePlayers = useCallback((player: any, player_index: number) => {
        if (player) {
            setAllPlayers((prevPlayers) => {
                const newPlayer: Blob = {
                    name: player.name,
                    authority: player.authority,
                    x: player.x,
                    y: player.y,
                    radius: 4 + Math.sqrt(player.mass / 10) * 6,
                    mass: player.mass,
                    score: player.score,
                    tax: player.tax,
                    speed: player.speed,
                    removal: player.scheduledRemovalTime,
                    target_x: player.targetX,
                    target_y: player.targetY,
                };
                const updatedPlayers = [...prevPlayers];
                updatedPlayers[player_index] = newPlayer;
                return updatedPlayers;
            });

        }
    }, [setAllPlayers, screenSize, currentPlayer]);

    const handlePlayersComponentChange = useCallback((accountInfo: AccountInfo<Buffer>, index: number) => {
        const parsedData = playersComponentClient.current?.coder.accounts.decode("player", accountInfo.data);
        updatePlayers(parsedData, index);
    }, [updatePlayers]);

    const handleFoodComponentChange = useCallback((accountInfo: AccountInfo<Buffer>, index: number) => {
        const parsedData = foodComponentClient.current?.coder.accounts.decode("section", accountInfo.data);
        updateFoodList(parsedData, index);
    }, [updateFoodList]);

    const handleMyPlayerComponentChange = useCallback((accountInfo: AccountInfo<Buffer>) => {
        const parsedData = playersComponentClient.current?.coder.accounts.decode("player", accountInfo.data);
        updateMyPlayer(parsedData);
    }, [updateMyPlayer]);


    const handleMapComponentChange = useCallback((accountInfo: AccountInfo<Buffer>) => {
        const parsedData = mapComponentClient.current?.coder.accounts.decode("map", accountInfo.data);
        updateMap(parsedData);
    }, [updateMap]);

    // Subscribe to the game state
    const subscribeToGame = useCallback(async (): Promise<void> => {
        if (!entityMatch.current) return;
        if (!currentPlayerEntity.current) return;

        playersComponentClient.current = await getComponentsClient(PLAYER_COMPONENT);
        foodComponentClient.current = await getComponentsClient(FOOD_COMPONENT);
        mapComponentClient.current = await getComponentsClient(MAP_COMPONENT);

        if (mapComponentSubscriptionId && mapComponentSubscriptionId.current) await providerEphemeralRollup.current.connection.removeAccountChangeListener(mapComponentSubscriptionId.current);
        if (myplayerComponentSubscriptionId && myplayerComponentSubscriptionId.current) await providerEphemeralRollup.current.connection.removeAccountChangeListener(myplayerComponentSubscriptionId.current);
        for (let i = 0; i < foodEntities.current.length; i++) {
            if (foodComponentSubscriptionId && foodComponentSubscriptionId.current) await providerEphemeralRollup.current.connection.removeAccountChangeListener(foodComponentSubscriptionId.current[i]);
        }
        for (let i = 0; i < playerEntities.current.length; i++) {
            if (playersComponentSubscriptionId && playersComponentSubscriptionId.current) await providerEphemeralRollup.current.connection.removeAccountChangeListener(playersComponentSubscriptionId.current[i]);
        }


        for (let i = 0; i < foodEntities.current.length; i++) {
            const foodComponenti = FindComponentPda({
                componentId: FOOD_COMPONENT,
                entity: foodEntities.current[i],
            });
            if (foodComponentSubscriptionId.current === null) {
                foodComponentSubscriptionId.current = [providerEphemeralRollup.current.connection.onAccountChange(foodComponenti, (accountInfo) => handleFoodComponentChange(accountInfo, i), 'processed')];
            } else {
                foodComponentSubscriptionId.current = [...foodComponentSubscriptionId.current, providerEphemeralRollup.current.connection.onAccountChange(foodComponenti, (accountInfo) => handleFoodComponentChange(accountInfo, i), 'processed')];
            }
        }

        for (let i = 0; i < playerEntities.current.length; i++) {
            const playersComponenti = FindComponentPda({
                componentId: PLAYER_COMPONENT,
                entity: playerEntities.current[i],
            });
            if (playersComponentSubscriptionId.current === null) {
                playersComponentSubscriptionId.current = [providerEphemeralRollup.current.connection.onAccountChange(playersComponenti, (accountInfo) => handlePlayersComponentChange(accountInfo, i), 'processed')];
            } else {
                playersComponentSubscriptionId.current = [...playersComponentSubscriptionId.current, providerEphemeralRollup.current.connection.onAccountChange(playersComponenti, (accountInfo) => handlePlayersComponentChange(accountInfo, i), 'processed')];
            }
        }

        const myplayerComponent = FindComponentPda({
            componentId: PLAYER_COMPONENT,
            entity: currentPlayerEntity.current,
        });

        myplayerComponentSubscriptionId.current = providerEphemeralRollup.current.connection.onAccountChange(myplayerComponent, handleMyPlayerComponentChange, 'processed');
        (playersComponentClient.current?.account as any).player.fetch(myplayerComponent, "processed").then(updateMyPlayer).catch((error: any) => {
            console.error("Failed to fetch account:", error);
        });
        for (let i = 0; i < foodEntities.current.length; i++) {
            const foodComponenti = FindComponentPda({
                componentId: FOOD_COMPONENT,
                entity: foodEntities.current[i],
            });
            (foodComponentClient.current?.account as any).section
                .fetch(foodComponenti, "processed")
                .then((fetchedData: any) => updateFoodList(fetchedData, i))
                .catch((error: any) => {
                });
        }

        for (let i = 0; i < playerEntities.current.length; i++) {
            const playersComponenti = FindComponentPda({
                componentId: PLAYER_COMPONENT,
                entity: playerEntities.current[i],
            });
            //console.log( i, playerEntities.current[i]);
            //console.log('player component', playersComponenti);
            (playersComponentClient.current?.account as any).player.fetch(playersComponenti, "processed").then((fetchedData: any) => updatePlayers(fetchedData, i)).catch((error: any) => {
                //console.error("Failed to fetch account:", error);
            });
        }

        const mapComponent = FindComponentPda({
            componentId: MAP_COMPONENT,
            entity: entityMatch.current,
        });
        mapComponentSubscriptionId.current = providerEphemeralRollup.current.connection.onAccountChange(mapComponent, handleMapComponentChange, 'processed');
        (mapComponentClient.current?.account as any).map.fetch(mapComponent, "processed").then(updateMap).catch((error: any) => {
            console.error("Failed to fetch account:", error);
        });

        setSubscribedToGame(true);
    }, [connection, handlePlayersComponentChange, handleMyPlayerComponentChange, handleFoodComponentChange, handleMapComponentChange, updatePlayers, updateFoodList, updateMap, updateMyPlayer]);

    const handleGameIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        try {
            setGameId(new PublicKey(newValue));
        } catch {
        }
    };

    const submitTransactionUser = useCallback(async (transaction: Transaction): Promise<string | null> => {
        if (isSubmitting) return null;
        setIsSubmitting(true);
        setTransactionError(null);
        setTransactionSuccess(null);
        try {
            const {
                context: { slot: minContextSlot },
                value: { blockhash, lastValidBlockHeight }
            } = await connection.getLatestBlockhashAndContext();

            const signature = await sendTransaction(transaction, connection, { minContextSlot });
            await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature }, "processed");

            setTransactionSuccess(`Transaction confirmed`);
            return signature;
        } catch (error) {
            setTransactionError(`Transaction failed: ${error}`);
        } finally {
            setIsSubmitting(false);
        }
        return null;
    }, [connection, isSubmitting, sendTransaction]);

    const submitTransaction = useCallback(async (transaction: Transaction, commitmetLevel: Commitment, skipPre: boolean): Promise<string | null> => {
        if (isSubmitting) return null;
        setIsSubmitting(true);
        setTransactionError(null);
        setTransactionSuccess(null);
        try {
            const {
                context: { slot: minContextSlot },
                value: { blockhash, lastValidBlockHeight }
            } = await provider.connection.getLatestBlockhashAndContext();

            if (!walletRef.current) {
                throw new Error('Wallet is not initialized');
            }
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = walletRef.current.publicKey;
            //transaction.sign(walletRef.current);

            /*const accountKeys = transaction.compileMessage().accountKeys;
            const publicKeys = accountKeys.map(key => key.toBase58());
            const feeEstimate = await getPriorityFeeEstimate("high", publicKeys);
            console.log(feeEstimate);
            const computePriceIx = ComputeBudgetProgram.setComputeUnitPrice({
              microLamports: feeEstimate.priorityFeeEstimate,
            });*/
            //180025000, 
            //1000001
            //1000001
            //transaction.add(computePriceIx);
            transaction.sign(walletRef.current);
            const signature = await provider.connection.sendRawTransaction(transaction.serialize(), {
                skipPreflight: skipPre,
                preflightCommitment: commitmetLevel,
            });
            console.log(signature);
            await provider.connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature }, commitmetLevel);
            //const signature = await sendAndConfirmTransaction(connection, transaction, [
            //    walletRef.current,
            //]);
            setTransactionSuccess(`Transaction confirmed`);
            return signature;
        } catch (error) {
            console.log(error);
            setTransactionError(`Transaction failed: ${error}`);
        } finally {
            setIsSubmitting(false);
        }
        return null;
    }, [connection, isSubmitting, sendTransaction]);

    const waitSignatureConfirmation = async (
        signature: string,
        connection: anchor.web3.Connection,
        commitment: anchor.web3.Commitment
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
                commitment
            );
        });
    };

    const checkTransactionStatus = async (
        connection: anchor.web3.Connection,
        signature: string
    ): Promise<boolean> => {
        try {
            const status = await connection.getSignatureStatus(signature, { searchTransactionHistory: true });
            if (status && status.value && status.value.confirmationStatus === "confirmed" && status.value.err === null) {
                console.log("Transaction succeeded:", signature);
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

    const retrySubmitTransaction = async (
        transaction: Transaction,
        connection: anchor.web3.Connection,
        commitment: anchor.web3.Commitment,
        maxRetries = 3,
        delay = 2000
    ): Promise<string | null> => {
        let attempts = 0;
        let signature: string | null = null;

        while (attempts < maxRetries) {
            try {
                // Submit the transaction
                signature = await submitTransaction(transaction, commitment, true);
                console.log("transaction attempt:", signature);
                await new Promise(resolve => setTimeout(resolve, 1000));
                // Check transaction status
                if (signature) {
                    const success = await checkTransactionStatus(connection, signature);
                    if (success) {
                        console.log("Transaction confirmed successfully");
                        return signature;
                    }
                }
            } catch (error) {
                console.error(`Attempt ${attempts + 1} failed:`, error);
            }
            attempts++;
            await new Promise((resolve) => setTimeout(resolve, delay));
        }

        console.error("Max retries reached. Transaction failed to confirm.");
        return null; // Return null if all retries fail
    };

    async function getPriorityFeeEstimate(priorityLevel: string, publicKeys: string[]) {
        const response = await fetch("https://mainnet.helius-rpc.com/?api-key=cba33294-aa96-414c-9a26-03d5563aa676", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'helius-example',
                method: 'getPriorityFeeEstimate',
                params: [
                    {
                        accountKeys: publicKeys,
                        options: {
                            recommended: true,
                        },
                    }
                ],
            }),
        });
        const data = await response.json();
        console.log(
            "Fee in function for",
            priorityLevel,
            " :",
            data.result.priorityFeeEstimate
        );
        return data.result;
    }

    /**
     * Create a new join game transaction
     */
    const joinGameTx = useCallback(async (selectGameId: ActiveGame) => {
        if (!playerKey) throw new WalletNotConnectedError();
        if (!publicKey) throw new WalletNotConnectedError();
        if (isSubmitting) return;
        if (isJoining) return;
        setIsJoining(true);
        setScreenSize({ width: selectGameId.size, height: selectGameId.size });
        const gameInfo = selectGameId;
        let maxplayer = 20;
        let foodcomponents = 32;

        const mapseed = "origin";
        const mapEntityPda = FindEntityPda({
            worldId: gameInfo.worldId,
            entityId: new anchor.BN(0),
            seed: mapseed
        })

        const mapComponentPda = FindComponentPda({
            componentId: MAP_COMPONENT,
            entity: mapEntityPda,
        });
        let map_size = 4000;
        const mapComponentClient = await getComponentsClient(MAP_COMPONENT);
        const mapacc = await providerEphemeralRollup.current.connection.getAccountInfo(
            mapComponentPda, "processed"
        );
        if (mapacc) {
            const mapParsedData = mapComponentClient.coder.accounts.decode("map", mapacc.data);
            console.log('map size', mapParsedData.width)
            map_size = mapParsedData.width;
        }
        setMapSize(map_size);
        if (map_size == 4000) {
            maxplayer = 20;
            foodcomponents = 16 * 5;
        }
        else if (map_size == 6000) {
            maxplayer = 40;
            foodcomponents = 36 * 5;
        }
        else if (map_size == 10000) {
            maxplayer = 100;
            foodcomponents = 100 * 5;
        }

        entityMatch.current = mapEntityPda;
        const foodEntityPdas: any[] = [];
        console.log(foodcomponents)

        for (let i = 1; i < foodcomponents + 1; i++) {
            const foodseed = 'food' + i.toString();
            const foodEntityPda = FindEntityPda({
                worldId: gameInfo.worldId,
                entityId: new anchor.BN(0),
                seed: foodseed
            })
            foodEntityPdas.push(foodEntityPda);
        }

        const playerEntityPdas: any[] = [];
        const playerClientER = await getComponentsClient(PLAYER_COMPONENT);
        const playerClient = await getComponentsClientBasic(PLAYER_COMPONENT);
        let newplayerEntityPda: any = null;
        let myPlayerId = '';
        let myPlayerStatus = 'new_player';
        let need_to_undelegate = false;
        for (let i = 1; i < maxplayer + 1; i++) {
            const playerentityseed = 'player' + i.toString();
            const playerEntityPda = FindEntityPda({
                worldId: gameInfo.worldId,
                entityId: new anchor.BN(0),
                seed: playerentityseed
            })
            playerEntityPdas.push(playerEntityPda);
            const playersComponentPda = FindComponentPda({
                componentId: PLAYER_COMPONENT,
                entity: playerEntityPda,
            });
            const playersacc = await provider.connection.getAccountInfo(
                playersComponentPda, "processed"
            );
            const playersaccER = await providerEphemeralRollup.current.connection.getAccountInfo(
                playersComponentPda, "processed"
            );
            if (playersacc) {
                const playersParsedData = playerClient.coder.accounts.decode("player", playersacc.data);
                //console.log(playersParsedData)
                if (playersaccER) {
                    const playersParsedDataER = playerClientER.coder.accounts.decode("player", playersaccER.data);
                    //console.log(playersParsedDataER)
                    if (playersParsedData.authority !== null && playersParsedDataER.authority !== null) {
                        //console.log('player', playersParsedDataER.authority.toString(), playersParsedData.authority.toString());
                        if (playersParsedData.authority.toString() == playerKey.toString()) {
                            if (playersParsedDataER.authority.toString() == playerKey.toString()) {
                                myPlayerStatus = "resume_session";
                                newplayerEntityPda = playerEntityPda;
                                myPlayerId = playerentityseed;
                                need_to_undelegate = false;
                            }
                            else {
                                myPlayerStatus = "rejoin_undelegated";
                                newplayerEntityPda = playerEntityPda;
                                myPlayerId = playerentityseed;
                                need_to_undelegate = false;
                            }
                        }
                    } else if (playersParsedData.authority !== null) {
                        //console.log('player', playersParsedDataER.authority, playersParsedData.authority.toString());
                        //if(playersParsedData.authority.toString() == playerKey.toString()){
                        if (playersParsedData.authority.toString() == playerKey.toString()) {
                            myPlayerStatus = "rejoin_undelegated";
                            newplayerEntityPda = playerEntityPda;
                            myPlayerId = playerentityseed;
                        }

                    }

                    // comment for now, this is a cleanup function...
                    // in case you leave the page and get eaten
                    /*if(playersParsedDataER.authority == null && 
                        playersParsedData.authority !== null && 
                        playersParsedDataER.x == 50000 &&
                        playersParsedDataER.y == 50000 &&
                        playersParsedDataER.score == 0 && 
                        newplayerEntityPda == null
                    ){
                        // set join time on buy in, check join time here, set again on spawn
                        // this might cause conflict is players join at the same time
                        newplayerEntityPda = playerEntityPda;
                        myPlayerId = playerentityseed;
                        need_to_undelegate=true;
                    }*/
                }
                //console.log('player auth', playersParsedData.authority);
                if (playersParsedData.authority == null && newplayerEntityPda == null) {
                    newplayerEntityPda = playerEntityPda;
                    myPlayerId = playerentityseed;
                    need_to_undelegate = false;
                }
            }
            else {
                if (newplayerEntityPda == null) {
                    newplayerEntityPda = playerEntityPda;
                    myPlayerId = playerentityseed;
                    need_to_undelegate = false;
                }
            }
        }
        console.log('my player', myPlayerId, myPlayerStatus);

        const anteseed = "ante";
        const anteEntityPda = FindEntityPda({
            worldId: gameInfo.worldId,
            entityId: new anchor.BN(0),
            seed: anteseed
        })
        const anteComponentPda = FindComponentPda({
            componentId: ANTEROOM_COMPONENT,
            entity: anteEntityPda,
        });
        const anteComponentClient = await getComponentsClient(ANTEROOM_COMPONENT);
        const anteacc = await provider.connection.getAccountInfo(
            anteComponentPda, "processed"
        );

        let token_account_owner_pda = new PublicKey(0);
        let vault_token_account = new PublicKey(0);
        let mint_of_token_being_sent = new PublicKey(0);
        let sender_token_account = new PublicKey(0);
        let payout_token_account = new PublicKey(0);
        let vault_program_id = new PublicKey("BAP315i1xoAXqbJcTT1LrUS45N3tAQnNnPuNQkCcvbAr");

        if (anteacc) {
            const anteParsedData = anteComponentClient.coder.accounts.decode("anteroom", anteacc.data);
            console.log(anteParsedData);
            vault_token_account = anteParsedData.vaultTokenAccount;
            mint_of_token_being_sent = anteParsedData.token;
            let usertokenAccountInfo = await getAssociatedTokenAddress(
                mint_of_token_being_sent,
                publicKey
            );
            payout_token_account = usertokenAccountInfo;
            const playerTokenAccount = await getAssociatedTokenAddress(mint_of_token_being_sent, playerKey);
            sender_token_account = playerTokenAccount;
            const playerbalance = await connection.getBalance(playerKey, 'processed');
            let targetBalance = 0.013 * LAMPORTS_PER_SOL;
            const amountToTransfer = targetBalance > playerbalance ? targetBalance - playerbalance : 0;
            const tokenAccountInfo = await connection.getAccountInfo(playerTokenAccount);
            let tokenaccountInfobalance = BigInt(0);
            if (tokenAccountInfo) {
                const tokenaccountInfodata = await getAccount(connection, sender_token_account);
                let tokenaccountInfobalance = tokenaccountInfodata.amount;
            }
            console.log(amountToTransfer);
            if (amountToTransfer > 0) {
                const createTokenAccountTx = createAssociatedTokenAccountInstruction(
                    publicKey,
                    playerTokenAccount,
                    playerKey,
                    mint_of_token_being_sent,
                );
                const transferIx = createTransferInstruction(
                    usertokenAccountInfo,
                    playerTokenAccount,
                    publicKey,
                    buyIn * 10 ** anteParsedData.tokenDecimals,
                    [],
                    splToken.TOKEN_PROGRAM_ID,
                );
                const soltransfertx = SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: playerKey,
                    lamports: amountToTransfer,
                });

                const combinedTx = new Transaction();
                if (amountToTransfer > 0) {
                    combinedTx.add(soltransfertx);
                }

                if (myPlayerStatus !== "rejoin_undelegated" && myPlayerStatus !== "resume_session") {
                    if (!tokenAccountInfo) {
                        combinedTx.add(createTokenAccountTx);
                        combinedTx.add(transferIx);
                    } else if (
                        tokenaccountInfobalance == BigInt(0)
                    ) {
                        combinedTx.add(transferIx);
                    }
                }

                if (amountToTransfer > 0 || ((tokenaccountInfobalance == BigInt(0) || !tokenAccountInfo) &&
                    myPlayerStatus !== "rejoin_undelegated" && myPlayerStatus !== "resume_session")
                    || myPlayerStatus == "new_player") {
                    const createwalletsig = await submitTransactionUser(combinedTx);
                }
            }
        }
        const playerComponentPda = FindComponentPda({
            componentId: PLAYER_COMPONENT,
            entity: newplayerEntityPda,
        });

        if (myPlayerStatus !== "rejoin_undelegated" && myPlayerStatus !== "resume_session") {
            try {
                const undelegateIx = createUndelegateInstruction({
                    payer: playerKey,
                    delegatedAccount: playerComponentPda,
                    componentPda: PLAYER_COMPONENT,
                });
                const undeltx = new anchor.web3.Transaction()
                    .add(undelegateIx);
                if (!walletRef.current) {
                    throw new Error('Wallet is not initialized');
                }
                undeltx.recentBlockhash = (await providerEphemeralRollup.current.connection.getLatestBlockhash()).blockhash;
                undeltx.feePayer = walletRef.current.publicKey;
                undeltx.sign(walletRef.current);
                const playerundelsignature = await providerEphemeralRollup.current.sendAndConfirm(undeltx, [], { skipPreflight: false });
                console.log('undelegate', playerundelsignature)
            } catch (error) {
                console.log('Error undelegating:', error);
            }
        }

        console.log('vault', vault_token_account.toString(), 'sender', sender_token_account.toString());
        if (myPlayerStatus !== "rejoin_undelegated" && myPlayerStatus !== "resume_session") {
            const applyBuyInSystem = await ApplySystem({
                authority: playerKey,
                world: gameInfo.worldPda,
                entities: [
                    {
                        entity: newplayerEntityPda,
                        components: [{ componentId: PLAYER_COMPONENT }],
                    },
                    {
                        entity: anteEntityPda,
                        components: [{ componentId: ANTEROOM_COMPONENT }],
                    },
                ],
                systemId: BUY_IN,
                args: {
                    buyin: buyIn,
                },
                extraAccounts: [
                    {
                        pubkey: vault_token_account,
                        isWritable: true,
                        isSigner: false,
                    },
                    {
                        pubkey: sender_token_account,
                        isWritable: true,
                        isSigner: false,
                    },
                    {
                        pubkey: payout_token_account,
                        isWritable: true,
                        isSigner: false,
                    },
                    {
                        pubkey: playerKey,
                        isWritable: true,
                        isSigner: false,
                    },
                    {
                        pubkey: SystemProgram.programId,
                        isWritable: false,
                        isSigner: false,
                    },
                    {
                        pubkey: TOKEN_PROGRAM_ID,
                        isWritable: false,
                        isSigner: false,
                    },
                    {
                        pubkey: SYSVAR_RENT_PUBKEY,
                        isWritable: false,
                        isSigner: false,
                    },
                ],
            });
            const computePriceIx = ComputeBudgetProgram.setComputeUnitPrice({
                microLamports: 1000002,
            });
            const computeLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
                units: 100_000,
            });
            const buyintx = new anchor.web3.Transaction().add(computePriceIx).add(computeLimitIx)
                .add(applyBuyInSystem.transaction);
            //const buyinsignature = await submitTransaction(buyintx, "confirmed", true);
            const buyinsignature = await retrySubmitTransaction(buyintx, connection, "confirmed");
            //if buy in fails, reclaim sol + coins, if succeeds everything else will work
            if (buyinsignature == null) {
                const reclaim_transaction = new Transaction();
                const playerbalance = await connection.getBalance(playerKey, 'processed');
                const accountInfo = await getAccount(connection, sender_token_account);
                const transfertokens = createTransferInstruction(
                    sender_token_account,
                    payout_token_account,
                    playerKey,
                    accountInfo.amount,
                    [],
                    splToken.TOKEN_PROGRAM_ID,
                );
                const closeInstruction = createCloseAccountInstruction(
                    sender_token_account,
                    publicKey,
                    playerKey,
                );
                const solTransferInstruction = SystemProgram.transfer({
                    fromPubkey: playerKey,
                    toPubkey: publicKey,
                    lamports: playerbalance - 1500000,
                });
                reclaim_transaction.add(transfertokens);
                reclaim_transaction.add(closeInstruction);
                reclaim_transaction.add(solTransferInstruction);
                const computePriceIx = ComputeBudgetProgram.setComputeUnitPrice({
                    microLamports: 1000002,
                });
                const computeLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
                    units: 10_000,
                });
                reclaim_transaction.add(computePriceIx).add(computeLimitIx);
                const reclaimsig = await submitTransaction(reclaim_transaction, "confirmed", true);
                console.log(
                    `buy in failed, reclaimed tokens: ${reclaimsig}`
                );
                setTransactionError("Buy in failed, reclaimed SOL and tokens");
                setIsSubmitting(false);
                return;
                //throw new Error('Buy in failed, reclaimed SOL');
            }
            else {
                console.log(
                    `buy in signature: ${buyinsignature}`
                );
            }
        }

        //if(myPlayerStatus !== "resume_session"){
        try {
            const playerdeltx = new anchor.web3.Transaction();
            const playerdelegateIx = createDelegateInstruction({
                entity: newplayerEntityPda,
                account: playerComponentPda,
                ownerProgram: PLAYER_COMPONENT,
                payer: playerKey,
            });
            playerdeltx.add(playerdelegateIx);
            const computePriceIx = ComputeBudgetProgram.setComputeUnitPrice({
                microLamports: 1000002,
            });
            const computeLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
                units: 80_000,
            });
            playerdeltx.add(computePriceIx).add(computeLimitIx);
            const playerdelsignature = await provider.sendAndConfirm(playerdeltx, [], { skipPreflight: true, commitment: 'finalized' }); //submitTransaction(playerdeltx, "confirmed", true); 
            console.log(
                `Delegation signature: ${playerdelsignature}`
            );
        } catch (error) {
            console.log('Error delegating:', error);
        }
        //}

        const applySystem = await ApplySystem({
            authority: playerKey,
            world: gameInfo.worldPda,
            entities: [
                {
                    entity: newplayerEntityPda,
                    components: [{ componentId: PLAYER_COMPONENT }],
                },
                {
                    entity: mapEntityPda,
                    components: [{ componentId: MAP_COMPONENT }],
                },
            ],
            systemId: JOIN_GAME,
            args: {
                name: playerName,
                //buyin: 1.0,
            },
        });
        const jointransaction = applySystem.transaction;
        const {
            context: { slot: minContextSlot },
            value: { blockhash, lastValidBlockHeight }
        } = await providerEphemeralRollup.current.connection.getLatestBlockhashAndContext();

        if (!walletRef.current) {
            setTransactionError("Wallet not found, please retry.");
            return;
            //throw new Error('Wallet is not initialized');
        }
        jointransaction.recentBlockhash = blockhash;
        jointransaction.feePayer = walletRef.current.publicKey;
        jointransaction.sign(walletRef.current);
        const signature = await providerEphemeralRollup.current.connection.sendRawTransaction(
            jointransaction.serialize(),
            { skipPreflight: true }
        ).catch((error) => {
            console.log(error)
        });
        console.log('joined game', signature);

        let playerJoined = false;
        let thisGameEnded = false;
        const startTime = Date.now();
        while (Date.now() - startTime < 5000) {
            const playersacc = await providerEphemeralRollup.current.connection.getAccountInfo(playerComponentPda, "processed");
            if (playersacc) {
                const playersParsedData = playerClientER.coder.accounts.decode("player", playersacc.data);
                if (playersParsedData.authority !== null) {
                    if (playersParsedData.x == 50000 && playersParsedData.y == 50000 && playersParsedData.score !== 0) {
                        thisGameEnded = true;
                    }
                    playerJoined = true;
                    break;
                }
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (Date.now() - startTime >= 5000) {
            //throw new Error("New Player not found within 5 seconds.");
            setTransactionError("New Player not found within 5 seconds, please retry joining.");
            setIsJoining(false);
            return;
        }
        if (playerJoined) {
            //dont join until player authority and position are updated
            setIsJoining(false);
            setGameId(mapEntityPda);
            setMapSize(selectGameId.size);
            entityMatch.current = mapEntityPda;
            currentPlayerEntity.current = newplayerEntityPda;
            anteroomEntity.current = anteEntityPda;
            currentWorldId.current = gameInfo.worldPda;
            foodEntities.current = foodEntityPdas;
            playerEntities.current = playerEntityPdas;
            const emptyPlayer: Blob = {
                name: 'unnamed',
                authority: null,
                x: 50000,
                y: 50000,
                radius: 0,
                mass: 0,
                score: 0,
                tax: 0,
                speed: 0,
                removal: new BN(0),
                target_x: 0,
                target_y: 0,
            };
            setAllPlayers(new Array(playerEntityPdas.length).fill(emptyPlayer));
            setAllFood(new Array(foodEntityPdas.length).fill([]));
            setFoodListLen(new Array(foodEntityPdas.length).fill(0));
            await subscribeToGame();
        }

    }, [playerKey, submitTransaction, subscribeToGame]);

    function findListIndex(pubkey: PublicKey): number | null {
        const index = allplayers.findIndex((player) => player.authority?.toString() === pubkey.toString());
        if (index !== -1) {
            return index;
        } else {
            return null;
        }
    }

    const preExitGameTx = useCallback(async () => {
        if (!playerKey) throw new WalletNotConnectedError();
        if (currentWorldId.current == null) {
            throw new Error("world not found");
        }
        const player_entity = currentPlayerEntity.current as PublicKey;
        const map_entity = entityMatch.current as PublicKey;
        const applySystem = await ApplySystem({
            authority: playerKey,
            world: currentWorldId.current,
            entities: [
                {
                    entity: player_entity,
                    components: [{ componentId: PLAYER_COMPONENT }],
                },
                {
                    entity: map_entity,
                    components: [{ componentId: MAP_COMPONENT }],
                },
            ],
            systemId: EXIT_GAME,
            args: {
                timestamp: performance.now(),
            },
        });
        const transaction = applySystem.transaction;
        const {
            context: { slot: minContextSlot },
            value: { blockhash, lastValidBlockHeight }
        } = await providerEphemeralRollup.current.connection.getLatestBlockhashAndContext();
        if (!walletRef.current) {
            throw new Error('Wallet is not initialized');
        }
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = walletRef.current.publicKey;
        transaction.sign(walletRef.current);
        console.log('staged exit');
        const signature = await providerEphemeralRollup.current.connection.sendRawTransaction(
            transaction.serialize(),
            { skipPreflight: true }
        );
    }, [playerKey, submitTransaction, subscribeToGame]);

    const exitGameTx = useCallback(async () => {
        if (!playerKey) throw new WalletNotConnectedError();
        if (currentWorldId.current == null) {
            throw new Error("world not found");
        }
        const player_entity = currentPlayerEntity.current as PublicKey;
        const map_entity = entityMatch.current as PublicKey;
        const applySystem = await ApplySystem({
            authority: playerKey,
            world: currentWorldId.current,
            entities: [
                {
                    entity: player_entity,
                    components: [{ componentId: PLAYER_COMPONENT }],
                },
                {
                    entity: map_entity,
                    components: [{ componentId: MAP_COMPONENT }],
                },
            ],
            systemId: EXIT_GAME,
            args: {
                timestamp: performance.now(),
            },
        });
        const transaction = applySystem.transaction;
        const {
            context: { slot: minContextSlot },
            value: { blockhash, lastValidBlockHeight }
        } = await providerEphemeralRollup.current.connection.getLatestBlockhashAndContext();

        if (!walletRef.current) {
            throw new Error('Wallet is not initialized');
        }
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = walletRef.current.publicKey;
        transaction.sign(walletRef.current);
        setCashingOut(true);
        const signature = await providerEphemeralRollup.current.sendAndConfirm(transaction);
        console.log('exiting', signature)
        if (signature != null) {
            setGameId(null);
            setGameEnded(2);
        }

    }, [playerKey, submitTransaction, subscribeToGame]);

    useEffect(() => {
        const cleanUp = async () => {
            if (
                currentPlayer &&
                Math.sqrt(currentPlayer.mass) == 0 &&
                currentPlayer.x === 50000 &&
                currentPlayer.y === 50000 &&
                ((cashingOut && gameEnded == 2) ||
                    !cashingOut)
            ) {
                if (currentWorldId.current == null) {
                    throw new Error("world not found");
                }
                //console.log(currentPlayer)
                if (currentPlayerEntity.current && anteroomEntity.current && entityMatch.current) {
                    const myplayerComponent = FindComponentPda({
                        componentId: PLAYER_COMPONENT,
                        entity: currentPlayerEntity.current,
                    });
                    let newplayersComponentClient = await getComponentsClient(PLAYER_COMPONENT);
                    (newplayersComponentClient.account as any).player.fetch(myplayerComponent, "processed").then(updateMyPlayerCashout).catch((error: any) => {
                        console.error("Failed to fetch account:", error);
                    });
                    const undelegateIx = createUndelegateInstruction({
                        payer: playerKey,
                        delegatedAccount: myplayerComponent,
                        componentPda: PLAYER_COMPONENT,
                    });
                    const tx = new anchor.web3.Transaction()
                        .add(undelegateIx);
                    if (!walletRef.current) {
                        throw new Error('Wallet is not initialized');
                    }
                    tx.recentBlockhash = (await providerEphemeralRollup.current.connection.getLatestBlockhash()).blockhash;
                    tx.feePayer = walletRef.current.publicKey;
                    tx.sign(walletRef.current);
                    try {
                        const playerdelsignature = await providerEphemeralRollup.current.sendAndConfirm(tx, [], { skipPreflight: false });
                        await waitSignatureConfirmation(
                            playerdelsignature,
                            providerEphemeralRollup.current.connection,
                            "finalized"
                        );
                        console.log('undelegate', playerdelsignature)
                    } catch (error) {
                        console.log('Error undelegating:', error);
                    }

                    const anteComponentPda = FindComponentPda({
                        componentId: ANTEROOM_COMPONENT,
                        entity: anteroomEntity.current,
                    });
                    const anteComponentClient = await getComponentsClient(ANTEROOM_COMPONENT);
                    const anteacc = await provider.connection.getAccountInfo(
                        anteComponentPda, "processed"
                    );
                    const mapComponent = FindComponentPda({
                        componentId: MAP_COMPONENT,
                        entity: entityMatch.current,
                    });

                    let token_account_owner_pda = new PublicKey(0);
                    let vault_token_account = new PublicKey(0);
                    let mint_of_token_being_sent = new PublicKey(0);
                    let sender_token_account = new PublicKey(0);
                    let owner_token_account = new PublicKey(0);
                    let supersize_token_account = new PublicKey(0);
                    let vault_program_id = new PublicKey("BAP315i1xoAXqbJcTT1LrUS45N3tAQnNnPuNQkCcvbAr");

                    if (anteacc && savedPublicKey) {
                        const anteParsedData = anteComponentClient.coder.accounts.decode("anteroom", anteacc.data);
                        vault_token_account = anteParsedData.vaultTokenAccount;
                        mint_of_token_being_sent = anteParsedData.token;
                        owner_token_account = anteParsedData.gamemasterTokenAccount;
                        //supersize_token_account = anteParsedData.gamemasterTokenAccount;
                        supersize_token_account = await getAssociatedTokenAddress(mint_of_token_being_sent, new PublicKey("DdGB1EpmshJvCq48W1LvB1csrDnC4uataLnQbUVhp6XB"));
                        let usertokenAccountInfo = await getAssociatedTokenAddress(
                            mint_of_token_being_sent,
                            savedPublicKey
                        );
                        let playerTokenAccount = await getAssociatedTokenAddress(mint_of_token_being_sent, playerKey);
                        sender_token_account = usertokenAccountInfo;
                        let [tokenAccountOwnerPda] = PublicKey.findProgramAddressSync(
                            [Buffer.from("token_account_owner_pda"), mapComponent.toBuffer()],
                            vault_program_id
                        );
                        if (playerCashoutAddy) {
                            sender_token_account = playerCashoutAddy;
                        }
                        if (cashingOut && gameEnded == 2) {
                            const applyCashOutSystem = await ApplySystem({
                                authority: playerKey,
                                world: currentWorldId.current,
                                entities: [
                                    {
                                        entity: currentPlayerEntity.current,
                                        components: [{ componentId: PLAYER_COMPONENT }],
                                    },
                                    {
                                        entity: anteroomEntity.current,
                                        components: [{ componentId: ANTEROOM_COMPONENT }],
                                    },
                                ],
                                systemId: CASH_OUT,
                                extraAccounts: [
                                    {
                                        pubkey: vault_token_account,
                                        isWritable: true,
                                        isSigner: false,
                                    },
                                    {
                                        pubkey: sender_token_account,
                                        isWritable: true,
                                        isSigner: false,
                                    },
                                    {
                                        pubkey: owner_token_account,
                                        isWritable: true,
                                        isSigner: false,
                                    },
                                    {
                                        pubkey: supersize_token_account,
                                        isWritable: true,
                                        isSigner: false,
                                    },
                                    {
                                        pubkey: tokenAccountOwnerPda,
                                        isWritable: true,
                                        isSigner: false,
                                    },
                                    {
                                        pubkey: playerKey,
                                        isWritable: true,
                                        isSigner: false,
                                    },
                                    {
                                        pubkey: SystemProgram.programId,
                                        isWritable: false,
                                        isSigner: false,
                                    },
                                    {
                                        pubkey: TOKEN_PROGRAM_ID,
                                        isWritable: false,
                                        isSigner: false,
                                    },
                                    {
                                        pubkey: SYSVAR_RENT_PUBKEY,
                                        isWritable: false,
                                        isSigner: false,
                                    },
                                ],
                            });
                            const computePriceIx = ComputeBudgetProgram.setComputeUnitPrice({
                                microLamports: 1000002,
                            });
                            const computeLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
                                units: 105_000,
                            });
                            const cashouttx = new anchor.web3.Transaction().add(computePriceIx).add(computeLimitIx).add(applyCashOutSystem.transaction);
                            //const cashoutsignature = await submitTransaction(cashouttx, "confirmed", true);
                            const cashoutsignature = await retrySubmitTransaction(cashouttx, connection, "confirmed");
                            console.log('cashout', cashoutsignature);
                            if (cashoutsignature) {
                                setCashoutTx(cashoutsignature);
                            } else {
                                setTransactionError("Error cashing out, please rejoin game to resume cashout");
                            }
                        }
                        const reclaim_transaction = new Transaction(); //.add(computePriceIx);
                        const playerbalance = await connection.getBalance(playerKey, 'processed');
                        const accountInfo = await getAccount(connection, playerTokenAccount);
                        const transfertokens = createTransferInstruction(
                            playerTokenAccount,
                            usertokenAccountInfo,
                            playerKey,
                            accountInfo.amount,
                            [],
                            splToken.TOKEN_PROGRAM_ID,
                        );
                        const closeInstruction = createCloseAccountInstruction(
                            playerTokenAccount,
                            savedPublicKey,
                            playerKey,
                        );
                        const solTransferInstruction = SystemProgram.transfer({
                            fromPubkey: playerKey,
                            toPubkey: savedPublicKey,
                            lamports: playerbalance - 1500000,
                        });
                        //reclaim_transaction.add(transfertokens);
                        reclaim_transaction.add(closeInstruction);
                        reclaim_transaction.add(solTransferInstruction);
                        const computePriceIx = ComputeBudgetProgram.setComputeUnitPrice({
                            microLamports: 1000002,
                        });
                        const computeLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
                            units: 10_000,
                        });
                        reclaim_transaction.add(computePriceIx).add(computeLimitIx);
                        const reclaimsig = await submitTransaction(reclaim_transaction, "confirmed", true);
                        console.log("get winnings", reclaimsig, accountInfo.amount, playerbalance);

                        if (reclaimsig) {
                            setReclaimTx(reclaimsig);
                        } else {
                            setTransactionError("Error cashing out, please rejoin game to resume cashout");
                            //setGameEnded(4);
                        }

                        playersComponentSubscriptionId.current = [];
                        currentPlayerEntity.current = null;
                        entityMatch.current = null;
                        foodEntities.current = [];
                        setPlayers([]);
                        setAllFood([]);
                        setFoodListLen([]);
                    }
                }

                setGameId(null);
                //if(gameEnded==0){
                //    setGameEnded(1);
                //}

                if (mapComponentSubscriptionId?.current) {
                    await providerEphemeralRollup.current.connection.removeAccountChangeListener(mapComponentSubscriptionId.current);
                }
                if (myplayerComponentSubscriptionId?.current) {
                    await providerEphemeralRollup.current.connection.removeAccountChangeListener(myplayerComponentSubscriptionId.current);
                }
                if (foodComponentSubscriptionId?.current) {
                    for (let i = 0; i < foodEntities.current.length; i++) {
                        await providerEphemeralRollup.current.connection.removeAccountChangeListener(foodComponentSubscriptionId.current[i]);
                    }
                }
                if (playersComponentSubscriptionId?.current) {
                    for (let i = 0; i < playerEntities.current.length; i++) {
                        await providerEphemeralRollup.current.connection.removeAccountChangeListener(playersComponentSubscriptionId.current[i]);
                    }
                }
            }
        };
        cleanUp();
    }, [gameEnded, gameId]);

    useEffect(() => {
        if (currentPlayer) {
            const visibleFood = allFood.map((foodList) => {
                return foodList.reduce<Food[]>((innerAcc, foodItem) => {
                    const diffX = foodItem.x - currentPlayer.x;
                    const diffY = foodItem.y - currentPlayer.y;
                    if (Math.abs(diffX) <= screenSize.width / 2 && Math.abs(diffY) <= screenSize.height / 2) {
                        innerAcc.push({
                            x: foodItem.x - currentPlayer.x + screenSize.width / 2,
                            y: foodItem.y - currentPlayer.y + screenSize.height / 2
                        });
                    }
                    return innerAcc;
                }, []);
            });
            setVisibleFood(visibleFood);
        }
    }, [currentPlayer]);

    const handleMovementAndCharging = async () => {
        const processSessionEphemTransaction = async (
            transaction: anchor.web3.Transaction
        ): Promise<string> => {
            const signature = await providerEphemeralRollup.current.connection.sendRawTransaction(
                transaction.serialize(),
                { skipPreflight: true }
            );
            return signature;
        };
        if (!exitHovered && currentWorldId.current && playerKey && currentPlayer && currentPlayer.authority && entityMatch.current && gameId && currentPlayerEntity.current) {
            try {
                const entity = gameId as PublicKey;
                let mouseX = mousePosition.x;
                let mouseY = mousePosition.y;
                const newX = Math.max(0, Math.min(screenSize.width, Math.floor(currentPlayer.x + mouseX - window.innerWidth / 2)));
                const newY = Math.max(0, Math.min(screenSize.height, Math.floor(currentPlayer.y + mouseY - window.innerHeight / 2)));

                const myplayerComponent = FindComponentPda({
                    componentId: PLAYER_COMPONENT,
                    entity: currentPlayerEntity.current,
                });

                const alltransaction = new anchor.web3.Transaction();
                let currentSection = getSectionIndex(currentPlayer.x, currentPlayer.y, mapSize, 2);
                for (const section_index of currentSection) {
                    const eatFoodTx = await ApplySystem({
                        authority: playerKey,
                        world: currentWorldId.current,
                        entities: [
                            {
                                entity: currentPlayerEntity.current,
                                components: [{ componentId: PLAYER_COMPONENT }],
                            },
                            {
                                entity: foodEntities.current[section_index],
                                components: [{ componentId: FOOD_COMPONENT }],
                            },
                            {
                                entity: entityMatch.current,
                                components: [{ componentId: MAP_COMPONENT }],
                            },
                        ],
                        systemId: EAT_FOOD,
                        args: {
                            timestamp: performance.now(),
                        },
                    });
                    alltransaction.add(eatFoodTx.transaction);
                }
                let playerstoeat = checkPlayerDistances(players, screenSize);
                if (playerstoeat) {
                    let playersListIndex = findListIndex(playerstoeat);
                    if (playersListIndex != null) {
                        const eatPlayerTx = await ApplySystem({
                            authority: playerKey,
                            world: currentWorldId.current,
                            entities: [
                                {
                                    entity: currentPlayerEntity.current,
                                    components: [{ componentId: PLAYER_COMPONENT }],
                                },
                                {
                                    entity: playerEntities.current[playersListIndex],
                                    components: [{ componentId: PLAYER_COMPONENT }],
                                },
                                {
                                    entity: entityMatch.current,
                                    components: [{ componentId: MAP_COMPONENT }],
                                },
                            ],
                            systemId: EAT_PLAYER,
                            args: {
                                timestamp: performance.now(),
                            },
                        });

                        alltransaction.add(eatPlayerTx.transaction);
                    }
                }

                let { food_x, food_y } = getClampedFoodPosition(currentPlayer.x, currentPlayer.y, newX, newY, currentPlayer.radius, mapSize, mapSize);
                let targetSectionBoosting = getSectionIndex(food_x, food_y, mapSize, 2);
                let selectedSection = targetSectionBoosting.reduce(
                    (minIndex, currentIndex) =>
                        foodListLen[currentIndex] < foodListLen[minIndex] ? currentIndex : minIndex,
                    targetSectionBoosting[0]
                );
                //let targetSectionBoosting = getSectionIndex(food_x, food_y, mapSize, true);
                const makeMove = await ApplySystem({
                    authority: playerKey,
                    world: currentWorldId.current,
                    entities: [
                        {
                            entity: currentPlayerEntity.current,
                            components: [{ componentId: PLAYER_COMPONENT }],
                        },
                        {
                            entity: foodEntities.current[selectedSection],
                            components: [{ componentId: FOOD_COMPONENT }],
                        },
                        {
                            entity: entityMatch.current,
                            components: [{ componentId: MAP_COMPONENT }],
                        },
                    ],
                    systemId: MOVEMENT,
                    args: {
                        x: newX,
                        y: newY,
                        boost: isMouseDown,
                        timestamp: performance.now(),
                    },
                });
                let transaction = makeMove.transaction;
                alltransaction.add(transaction);

                const {
                    context: { slot: minContextSlot },
                    value: { blockhash, lastValidBlockHeight }
                } = await providerEphemeralRollup.current.connection.getLatestBlockhashAndContext();

                if (!walletRef.current) {
                    throw new Error('Wallet is not initialized');
                }
                alltransaction.recentBlockhash = blockhash;
                alltransaction.feePayer = walletRef.current.publicKey;
                alltransaction.sign(walletRef.current);
                let signature = await processSessionEphemTransaction(alltransaction).catch((error) => {
                    console.log(error)
                });
                setIsSubmitting(false);
                setTransactionError(null);
                setTransactionSuccess(null);
            } catch (error) {
                setIsSubmitting(false);
                //console.error("Failed to execute system or submit transaction:", error);
            }
        }
    };

    useEffect(() => {

        const intervalId = setInterval(() => {
            handleMovementAndCharging();
        }, 30);

        return () => clearInterval(intervalId);
    }, [gameId, currentPlayer, exitHovered, isMouseDown]);

    useEffect(() => {
        //const firstHalf = foodListLen.slice(0, Math.floor(foodListLen.length / 2));
        //const hasValueLessThan100 = firstHalf.some(value => value < 100);

        const intervalId = setInterval(() => {
            processNewFoodTransaction(nextFood.current.x, nextFood.current.y);
        }, 200);

        return () => clearInterval(intervalId);
    }, [gameId, nextFood]);

    function getClampedFoodPosition(player_x: number, player_y: number, target_x: number, target_y: number, player_radius: number, map_width: number, map_height: number): { food_x: number; food_y: number } {
        const dx = target_x - player_x;
        const dy = target_y - player_y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const unit_x = dx / dist;
        const unit_y = dy / dist;
        const pseudo_random_float_x = 1.5;
        const pseudo_random_float_y = 1.5;
        const offset_x = -unit_x * player_radius * pseudo_random_float_x;
        const offset_y = -unit_y * player_radius * pseudo_random_float_y;
        const food_x = Math.round(player_x + offset_x);
        const food_y = Math.round(player_y + offset_y);
        const clamped_food_x = Math.min(Math.max(food_x, 0), map_width);
        const clamped_food_y = Math.min(Math.max(food_y, 0), map_height);
        return { food_x: clamped_food_x, food_y: clamped_food_y };
    }

    const checkPlayerDistances = (visiblePlayers: Blob[], screenSize: { width: number, height: number }) => {
        if (currentPlayer?.radius) {
            const centerX = screenSize.width / 2;
            const centerY = screenSize.height / 2;

            for (const player of visiblePlayers) {
                const distance = Math.sqrt((player.x - centerX) ** 2 + (player.y - centerY) ** 2);
                if (distance < currentPlayer.radius) {
                    return player.authority;
                }
            }
        }
        return null;
    };

    const checkFoodDistances = (visibleFood: { x: number, y: number }[], screenSize: { width: number, height: number }) => {
        if (currentPlayer?.radius) {
            const centerX = screenSize.width / 2;
            const centerY = screenSize.height / 2;
            //console.log(visibleFood)
            return visibleFood.some(food => {
                const distance = Math.sqrt((food.x - centerX) ** 2 + (food.y - centerY) ** 2);
                return distance < currentPlayer.radius;
            });
        }
        return null;
    };

    function getSectionIndex(x: number, y: number, mapSize: number, duplicateEncodings: number = 5): number[] {
        const sectionSize = 1000;
        const sectionsPerRow = mapSize / sectionSize;
        const mapSectionCount = sectionsPerRow * sectionsPerRow;
        const adjustedX = Math.min(x, mapSize - 1);
        const adjustedY = Math.min(y, mapSize - 1);
        //const row = Math.floor(adjustedX / sectionSize);
        //const col = Math.floor(adjustedY / sectionSize);
        const row = Math.floor(adjustedY / sectionSize);
        const col = Math.floor(adjustedX / sectionSize);
        let baseIndex = row * sectionsPerRow + col;
        //if (duplicateEncoding) {
        //    baseIndex += mapSectionCount;
        //}
        let food_indices: number[] = [];
        for (let i = 0; i < duplicateEncodings; i++) {
            food_indices.push(baseIndex + i * mapSectionCount)
        }

        return food_indices;
    }

    const processNewFoodTransaction = async (foodX: number, foodY: number) => {
        if (currentWorldId.current !== null) {
            const allTransaction = new anchor.web3.Transaction();
            if (currentPlayerEntity.current && entityMatch.current) {
                try {
                    const mapComponent = FindComponentPda({
                        componentId: MAP_COMPONENT,
                        entity: entityMatch.current,
                    });
                    const mapacc = await providerEphemeralRollup.current.connection.getAccountInfo(
                        mapComponent, "processed"
                    );
                    let nextFoodx = foodX;
                    let nextFoody = foodY;
                    if (mapacc) {
                        const mapParsedData = mapComponentClient.current?.coder.accounts.decode("map", mapacc?.data);
                        if (mapParsedData.nextFood != null) {
                            nextFoodx = mapParsedData.nextFood.x;
                            nextFoody = mapParsedData.nextFood.y;
                        }
                    }
                    let currentSection = getSectionIndex(foodX, foodY, mapSize, 2);
                    let selectedSection = currentSection.reduce(
                        (minIndex, currentIndex) =>
                            foodListLen[currentIndex] < foodListLen[minIndex] ? currentIndex : minIndex,
                        currentSection[0]
                    );
                    /*let current_foodlist = foodListLen.reduce((minIndex, currentValue, currentIndex, array) =>
                        currentValue < array[minIndex] ? currentIndex : minIndex
                    , 0);*/
                    const newFoodTx = await ApplySystem({
                        authority: foodKey,
                        world: currentWorldId.current,
                        entities: [
                            {
                                entity: entityMatch.current,
                                components: [{ componentId: MAP_COMPONENT }],
                            },
                            {
                                entity: foodEntities.current[selectedSection],
                                components: [{ componentId: FOOD_COMPONENT }],
                            },
                        ],
                        systemId: SPAWN_FOOD,
                        args: {
                            timestamp: performance.now(),
                        },
                    });
                    const {
                        context: { slot: minContextSlot },
                        value: { blockhash, lastValidBlockHeight }
                    } = await providerEphemeralRollup.current.connection.getLatestBlockhashAndContext();

                    if (!walletRef.current) {
                        throw new Error('Wallet is not initialized');
                    }

                    allTransaction.add(newFoodTx.transaction);
                    allTransaction.recentBlockhash = blockhash;
                    allTransaction.feePayer = foodwalletRef.current.publicKey;
                    allTransaction.sign(foodwalletRef.current);
                    const signature = await providerEphemeralRollup.current.connection.sendRawTransaction(
                        allTransaction.serialize(),
                        { skipPreflight: true }
                    ).catch((error) => {
                        //console.log(error); 
                    });
                    if (signature) {
                        await waitSignatureConfirmation(
                            signature,
                            providerEphemeralRollup.current.connection,
                            "finalized"
                        );
                        //console.log('new food', signature)
                    }
                } catch (error) {
                    //console.log("Transaction failed", error);
                }
            }
        }
    };

    const handleExitClick = () => {
        if (playerExiting) return;
        if (playerRemovalTimeRef.current !== null) {
            preExitGameTx();
        }
        preExitGameTx();
        setPlayerExiting(true);

        const interval = setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);

        const startTime = Date.now();
        // Set up an interval to continually check if 6 seconds have passed
        const checkRemovalTime = setInterval(() => {
            if (playerRemovalTimeRef.current && !playerRemovalTimeRef.current.isZero()) { // Ensure it's not zero
                const startTime = playerRemovalTimeRef.current.toNumber() * 1000; // Convert to ms
                clearInterval(checkRemovalTime); // Stop checking for `playerRemovalTime`

                const timeoutinterval = setInterval(() => {
                    const currentTime = Date.now();
                    const elapsedTime = currentTime - startTime;

                    if (elapsedTime >= 6000) {
                        console.log("5 seconds have passed");
                        exitGameTx();
                        clearInterval(timeoutinterval);
                        clearInterval(interval);
                        setPlayerExiting(false);
                    } else {
                        console.log("Waiting...", elapsedTime);
                    }
                }, 1000);
            }
        }, 100); // Check every 100ms if `playerRemovalTime` has been updated
    };

    useEffect(() => {
        if (!playerExiting) {
            setCountdown(5);
        }
    }, [playerExiting]);

    useEffect(() => {
        if (entityMatch || gameId) {
            const handleMouseMove = (event: MouseEvent) => {
                setMousePosition({ x: event.clientX, y: event.clientY });
            };

            const handleMouseDown = (event: MouseEvent) => {
                setIsMouseDown(true);
            };

            const handleMouseUp = () => {
                setIsMouseDown(false);
            };

            window.addEventListener('mousedown', handleMouseDown);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('mousemove', handleMouseMove);

            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mousedown', handleMouseDown);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [playerKey, gameId, entityMatch, currentPlayer, screenSize]);

    useEffect(() => {
        function translateLargerRectangle() {
            const largerRectangle = document.getElementsByClassName('game')[0] as HTMLElement;;
            const smallerRectangle = document.getElementsByClassName('gameWrapper')[0] as HTMLElement;;

            if (largerRectangle && smallerRectangle) {
                const widthLarger = screenSize.width * scale;
                const heightLarger = screenSize.height * scale;
                const widthSmaller = smallerRectangle.offsetWidth;
                const heightSmaller = smallerRectangle.offsetHeight;
                const deltaX = (widthSmaller / 2) - (widthLarger / 2);
                const deltaY = (heightSmaller / 2) - (heightLarger / 2);
                largerRectangle.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            } else {
                console.error('Elements with class name "gameWrapper" or "game" not found.');
            }
        }
        translateLargerRectangle();

    }, [gameId, setGameId, screenSize]);

    useEffect(() => {
        const getTPS = async () => {
            const recentSamples = await connection.getRecentPerformanceSamples(4);
            const totalTransactions = recentSamples.reduce((total, sample) => total + sample.numTransactions, 0);
            const averageTransactions = totalTransactions / recentSamples.length;
            setCurrentTPS(Math.round(averageTransactions));
            //console.log(recentSamples[0].numTransactions);
        };
        getTPS();
    }, []);

    async function getTokenBalance(connection: Connection, vault: PublicKey, decimals: number): Promise<number> {
        const balance = await connection.getTokenAccountBalance(vault);
        return parseFloat(balance.value.amount) / Math.pow(10, decimals); // Adjust the balance for the token's decimals
    }
    async function parsePoolInfo() {
        const mainnet_connection = new Connection("https://mainnet.helius-rpc.com/?api-key=cba33294-aa96-414c-9a26-03d5563aa676");
        const info = await mainnet_connection.getAccountInfo(new PublicKey(SOL_USDC_POOL_ID));
        if (!info) return;
        const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(info.data);
        const baseTokenDecimals = 9; // Decimals for SOL
        const quoteTokenDecimals = 6; // Decimals for USDC
        const baseTokenBalance = await getTokenBalance(mainnet_connection, poolState.baseVault, baseTokenDecimals);
        const quoteTokenBalance = await getTokenBalance(mainnet_connection, poolState.quoteVault, quoteTokenDecimals);
        const priceOfBaseInQuote = quoteTokenBalance / baseTokenBalance;
        setPrice(priceOfBaseInQuote);
    }

    useEffect(() => {
        parsePoolInfo();
    }, []);

    const handleClick = (index: number) => {
        setOpenGameInfo(prevState => {
            const newState = [...prevState];
            newState[index] = !newState[index];
            return newState;
        });
    };

    const handleImageClick = async () => {
        if (inputValue.trim() !== '') {
            try {
                const worldId = { worldId: new anchor.BN(inputValue.trim()) };
                const worldPda = await FindWorldPda(worldId);
                const newGameInfo: ActiveGame = { worldId: worldId.worldId, worldPda: worldPda, name: "loading", active_players: 0, max_players: 0, size: 0, image: "", token: "" }
                console.log('new game info', newGameInfo.worldId, newGameInfo.worldPda.toString())
                setNewGameCreated(newGameInfo);
                setActiveGames([newGameInfo, ...activeGames]);
                setOpenGameInfo(new Array(activeGames.length).fill(false));
            } catch (error) {
                console.error("Invalid PublicKey:", error);
            }
        }
    };
    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleImageClick();
        }
    };

    const fetchAndLogMapData = async () => {

        for (let i = 0; i < activeGames.length; i++) {
            const mapseed = "origin";
            const mapEntityPda = FindEntityPda({
                worldId: activeGames[i].worldId,
                entityId: new anchor.BN(0),
                seed: mapseed
            });
            const mapComponentPda = FindComponentPda({
                componentId: MAP_COMPONENT,
                entity: mapEntityPda,
            });

            try {
                let token_image = `${process.env.PUBLIC_URL}/token.png`;
                let token_name = "LOADING";
                const anteseed = "ante";
                const anteEntityPda = FindEntityPda({
                    worldId: activeGames[i].worldId,
                    entityId: new anchor.BN(0),
                    seed: anteseed
                })
                const anteComponentPda = FindComponentPda({
                    componentId: ANTEROOM_COMPONENT,
                    entity: anteEntityPda,
                });
                const anteComponentClient = await getComponentsClient(ANTEROOM_COMPONENT);
                const anteacc = await provider.connection.getAccountInfo(
                    anteComponentPda, "processed"
                );
                let mint_of_token_being_sent = new PublicKey(0);
                if (anteacc) {
                    const anteParsedData = anteComponentClient.coder.accounts.decode("anteroom", anteacc.data);
                    mint_of_token_being_sent = anteParsedData.token;
                    if (mint_of_token_being_sent.toString() === "7dnMwS2yE6NE1PX81B9Xpm7zUhFXmQABqUiHHzWXiEBn") {
                        token_image = `${process.env.PUBLIC_URL}/agld.jpg`;
                        token_name = "AGLD";
                    } else {
                        token_image = `${process.env.PUBLIC_URL}/usdc.png`;
                        token_name = "USDC";
                    }
                }

                const mapComponentClient = await getComponentsClient(MAP_COMPONENT);
                const mapacc = await providerEphemeralRollup.current.connection.getAccountInfo(
                    mapComponentPda, "processed"
                );
                if (mapacc) {
                    const mapParsedData = mapComponentClient.coder.accounts.decode("map", mapacc.data);
                    console.log(`Parsed Data for game ID ${activeGames[i].worldId}:`, mapParsedData);
                    const playerClient = await getComponentsClientBasic(PLAYER_COMPONENT);
                    let activeplayers = 0;
                    for (let player_index = 1; i < mapParsedData.maxPlayers + 1; player_index++) {
                        const playerentityseed = 'player' + player_index.toString();
                        const playerEntityPda = FindEntityPda({
                            worldId: activeGames[i].worldId,
                            entityId: new anchor.BN(0),
                            seed: playerentityseed
                        })
                        const playersComponentPda = FindComponentPda({
                            componentId: PLAYER_COMPONENT,
                            entity: playerEntityPda,
                        });
                        const playersacc = await provider.connection.getAccountInfo(
                            playersComponentPda, "processed"
                        );
                        if (playersacc) {
                            const playersParsedData = playerClient.coder.accounts.decode("player", playersacc.data);
                            //console.log(playersParsedData)
                            if (playersParsedData.authority != null) {
                                activeplayers = activeplayers + 1;
                            }
                        } else {
                            break;
                        }
                    }
                    setActiveGames(prevActiveGames => {
                        const updatedGames = prevActiveGames.map(game =>
                            game.worldId === activeGames[i].worldId && game.worldPda.toString() === activeGames[i].worldPda.toString()
                                ? { ...game, name: mapParsedData.name, active_players: activeplayers, max_players: mapParsedData.maxPlayers, size: mapParsedData.width, image: token_image, token: token_name }

                                : game
                        );
                        return updatedGames;
                    });
                } else {
                    //console.log(providerEphemeralRollup.current)
                    console.log(`No account info found for game ID ${activeGames[i].worldId}`);
                }
            } catch (error) {
                console.log(`Error fetching map data for game ID ${activeGames[i].worldId}:`, error);
            }
        }
    };

    useEffect(() => {

        fetchAndLogMapData();

    }, [openGameInfo, enpointDone, selectedOption]);

    useEffect(() => {
        const scrollableElement = document.querySelector('.info-text-container');
        if (!scrollableElement) return;

        const handleScroll = () => {
            const scrollPosition = scrollableElement.scrollTop / 20;
            const image = document.querySelector('.info-spinning-image') as HTMLImageElement;

            if (image) {
                console.log('Image found:', image);
                image.style.transform = `rotate(${scrollPosition}deg)`;
            } else {
                console.log('Image not found');
            }
        };

        scrollableElement.addEventListener('scroll', handleScroll);

        return () => {
            scrollableElement.removeEventListener('scroll', handleScroll);
        };
    }, [buildViewerNumber]);

    useEffect(() => {
        let scrollY = 0;
        if (buildViewerNumber == 0 || buildViewerNumber == 1) {
            const handleWheel = (event: WheelEvent) => {
                scrollY += event.deltaY;

                const element = document.querySelector('.info-text-container');
                let scrollTop = 0;
                if (element) {
                    scrollTop = element.scrollTop;
                }
                scrollY += event.deltaY;

                if (scrollY > 20 && !element) {
                    console.log('User has scrolled more than 50 pixels down.');
                    setbuildViewerNumber(1);
                } else if (scrollY < -20 && scrollTop === 0 && element) {
                    console.log('User has scrolled more than 50 pixels up.');
                    setbuildViewerNumber(0);
                }
            };

            window.addEventListener('wheel', handleWheel);

            return () => {
                window.removeEventListener('wheel', handleWheel);
            };
        }
    }, [buildViewerNumber]);

    useEffect(() => {
        const handleScroll = () => {
            const element = document.querySelector('.info-text-container');
            if (element) {
                const scrollTop = element.scrollTop;
                const scrollHeight = element.scrollHeight;
                const clientHeight = element.clientHeight;
                if (scrollTop + clientHeight >= scrollHeight) {
                    setFooterVisible(true);
                } else {
                    setFooterVisible(false);
                }
            }
        };

        const handleTouchMove = () => {
            handleScroll();
        };

        const element = document.querySelector('.info-text-container');
        if (element) {
            element.addEventListener('scroll', handleScroll);
            window.addEventListener('touchmove', handleTouchMove);
        }

        return () => {
            if (element) {
                element.removeEventListener('scroll', handleScroll);
                window.removeEventListener('touchmove', handleTouchMove);
            }
        };
    }, [buildViewerNumber]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1000);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        const logoElement = document.querySelector('.logo-image') as HTMLElement | null;
        if (logoElement) {
            logoElement.style.transform = 'none';
        } else {
            console.warn('Element with class name "logo-image" not found.');
        }
    }, [buildViewerNumber]);

    return (
        <>
            <div className="supersize">
                <Navbar
                    gameId={gameId}
                    gameEnded={gameEnded}
                    buildViewerNumber={buildViewerNumber}
                    isMobile={isMobile}
                    setIsDropdownOpen={setIsDropdownOpen}
                    isDropdownOpen={isDropdownOpen}
                    selectedOption={selectedOption}
                    handleOptionClick={handleOptionClick}
                    options={options}
                    setbuildViewerNumber={setbuildViewerNumber}
                    setIsHovered={setIsHovered}
                    isHovered={isHovered}
                    footerVisible={footerVisible}
                    activeGames={activeGames}
                    WalletMultiButton={WalletMultiButton}
                />
                <>
                    {buildViewerNumber == 0 ? (
                        <>
                            <HeroSection
                                gameId={gameId}
                                gameEnded={gameEnded}
                                playerName={playerName}
                                handleNameChange={handleNameChange}
                                activeGames={activeGames}
                                buyIn={buyIn}
                                setBuyIn={setBuyIn}
                                expandlist={expandlist}
                                setexpandlist={setexpandlist}
                                openGameInfo={openGameInfo}
                                setOpenGameInfo={setOpenGameInfo}
                                handleClick={handleClick}
                                inputValue={inputValue}
                                handleInputChange={handleInputChange}
                                handleKeyPress={handleKeyPress}
                                handleImageClick={handleImageClick}
                                joinGameTx={joinGameTx}
                                setbuildViewerNumber={setbuildViewerNumber}
                                handleSliderChange={handleSliderChange}
                                setActiveGames={setActiveGames}
                            />
                        </>) : (
                        <>
                            {buildViewerNumber == 1 ? (
                                <>
                                    <Info
                                        gameId={gameId}
                                        gameEnded={gameEnded}
                                        footerVisible={footerVisible}
                                        isHovered={isHovered}
                                        setIsHovered={setIsHovered}
                                        setbuildViewerNumber={setbuildViewerNumber}
                                        activeGames={activeGames}
                                        openDocs={openDocs}
                                        openX={openX}
                                        openTG={openTG}
                                    />
                                </>
                            ) : (
                                <div className="game-select" style={{ display: gameId == null && gameEnded == 0 ? 'flex' : 'none', height: '86vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                    <CreateGameComponent
                                        connection={connection}
                                        playerKey={playerKey}
                                        walletRef={walletRef}
                                        provider={provider}
                                        providerEphemeralRollup={providerEphemeralRollup}
                                        buildViewerNumber={buildViewerNumber}
                                        isSubmitting={isSubmitting}
                                        newGameCreated={newGameCreated}
                                        activeGames={activeGames}
                                        gamewallet={gamewallet}
                                        setTransactionError={setTransactionError}
                                        setTransactionSuccess={setTransactionSuccess}
                                        setIsSubmitting={setIsSubmitting}
                                        setActiveGames={setActiveGames}
                                        setbuildViewerNumber={setbuildViewerNumber}
                                        setNewGameCreated={setNewGameCreated}
                                        setGameWallet={setGameWallet}
                                    />
                                </div>
                            )}
                        </>
                    )}
                    <Footer
                        gameId={gameId}
                        gameEnded={gameEnded}
                        buildViewerNumber={buildViewerNumber}
                        isMobile={isMobile}
                        currentTPS={currentTPS}
                        price={price}
                        isHovered={isHovered}
                        setIsHovered={setIsHovered}
                        setbuildViewerNumber={setbuildViewerNumber}
                        openDocs={openDocs}
                        openX={openX}
                        openTG={openTG}
                    />

                </>
                <GameWrapper
                    gameId={gameId}
                    players={players}
                    visibleFood={visibleFood.flat()}
                    currentPlayer={currentPlayer}
                    screenSize={screenSize}
                    scale={scale}
                    gameEnded={gameEnded}
                    setPlayerCashout={setPlayerCashout}
                    playerCashout={playerCashout}
                    playerTax={playerTax}
                    cashoutTx={cashoutTx}
                    reclaimTx={reclaimTx}
                    exitTxn={exitTxn}
                    handleExitClick={handleExitClick}
                />
                {(isSubmitting || isJoining) && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-end',
                        position: 'fixed',
                        bottom: '120px',
                        left: 0,
                        width: '100%',
                        zIndex: 1000,
                    }}>
                        <div className="spinner"></div>
                    </div>
                )}

                {transactionError && <Alert type="error" message={transactionError} onClose={() => setTransactionError(null)} />}

                {(transactionSuccess && !isJoining) && <Alert type="success" message={transactionSuccess} onClose={() => setTransactionSuccess(null)} />}
            </div>
        </>
    );
};

export default App;