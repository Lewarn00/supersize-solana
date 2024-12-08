import React, {useCallback, useEffect, useRef, useState} from "react";
import {AnimatePresence, motion} from "framer-motion";
import Button from "./components/Button";
import CreateGame from "./components/CreateGame";
import GameComponent from "./components/GameComponent";
import CreateGameComponent from "./components/CreateGameComponent";
import Alert from "./components/Alert";
import Leaderboard from "./components/Leaderboard";
import CopyLink from "./components/buddyReferral";
import Invite from "./components/buddyInvite";
import TweetLink from "./components/buddyTweet";

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

import {WalletNotConnectedError} from '@solana/wallet-adapter-base';
import {useConnection, useWallet} from '@solana/wallet-adapter-react';
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {Connection, 
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
    PublicKey} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import {Idl, Program, Provider, Wallet, AnchorProvider} from "@coral-xyz/anchor";
import {SimpleProvider} from "./components/Wallet";
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
import { Metadata, PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { Client, USDC_MINT } from "@ladderlabs/buddy-sdk";
import { initBuddyState, initialBuddyLink, useInitBuddyLink,
    useBuddyState, useBuddyLink, BUDDY_STATUS, getTreasuryPDA, getBuddyPDA,
    BUDDY_MINTS, getMemberPDA
 } from "buddy.link";

import * as crypto from 'crypto-js';
import axios from "axios";

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
    size: number;
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
    timestamp: number;
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
    base_buyin: number;
    min_buyin: number;
    max_buyin: number;
  };

const CURRENT_NETWORK = "Mainnet";

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
    const organization = CURRENT_NETWORK === 'Mainnet' ? 'supersize' : undefined

    useInitBuddyLink(connection, wallet, organization, { debug: true }) // TODO: turn off debug

    return null
}

const App: React.FC = () => {
    //let { connection } =  useConnection();
    const  connection =  new Connection("https://proud-late-lambo.solana-devnet.quiknode.pro/ec12ab7b183190f9cfd274049f6ab83396c22e7d"); 
    //const  connection =  new Connection("https://floral-convincing-dawn.solana-mainnet.quiknode.pro/73d5d52678fd227b48dd0aec6a8e94ac9dd61f59"); 
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
    ];
    */

    const [isReferrerModalOpen, setIsReferrerModalOpen] = useState(false);
    const [referrerInput, setReferrerInput] = useState<string>("");
    const [username, setUsername] = useState<string>("");
    const myReferralAccount = useRef<string>("");
    const myReferrer = useRef<string>("");
    const { referrer, member, profile } = useBuddyLink();

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
    const [screenSize, setScreenSize] = useState({width: 2000,height: 2000});
    const [mapSize, setMapSize] = useState(4000);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isJoining, setIsJoining] = useState<boolean>(false);
    const [moveSignature, setMoveSignature] = useState<string | null>(null);
    const [transactionError, setTransactionError] = useState<string | null>(null);
    const [transactionSuccess, setTransactionSuccess] = useState<string | null>(null);
       /*
      const endpointToWorldMap: Record<string, { worldId: anchor.BN; worldPda: PublicKey }> = {
        "https://supersize-mainnet-sin.magicblock.app": {
          worldId: new anchor.BN(8),
          worldPda: new PublicKey('B8nxHq1NadQKbuaAwow9vHaCty9LcWrYBtD5db216boR'),
        }, //1, 9LKNh9Ma4WjGUHvohbAAdGpZFNUWmgEQRRgvYwRL25ma 
        "https://supersize-mainnet-bos.magicblock.app": {
          worldId: new anchor.BN(7),
          worldPda: new PublicKey('9S7BFk4apJ3ZKVYbt7PSWeJY5n3qnsB4AVJWh1ogyo8r'),
        }, //2, 5Fj5HJud66muuDyateWdP2HAPkED7CnyApDQBMreVQQH
        "https://supersize-mainnet.magicblock.app": {
          worldId: new anchor.BN(4),
          worldPda: new PublicKey('AGUNzsmCpRp53DPYXY9Yw6Lwg5b5heSkTRyafTkfNYJv'),
        }, //3, 8XG8vqYo1vxURMXuU7RboftYGVWYq11M41HCzHLYzejt
      }; 
       */
   
      const endpointToWorldMap: Record<string, { worldId: anchor.BN; worldPda: PublicKey }> = {
        "https://supersize-sin.magicblock.app": {
          worldId: new anchor.BN(1666),
          worldPda: new PublicKey('BQ4vkTpteu5EcM5dYTSCGAQKbW5JumeyLm3o6yvyzqHw'),
        },
        "https://supersize.magicblock.app": {
          worldId: new anchor.BN(1683),
          worldPda: new PublicKey('3f6AomGdReXwbJ1cK54LdNULeMrUmw6kYS2Sfu9CPHoa'),
        },
        "https://supersize-fra.magicblock.app": {
          worldId: new anchor.BN(1727),
          worldPda: new PublicKey('A5F8bV8wyMNS4dLpfckfxpfHFBTdgd8FW34K7UwxCNvX'),
        }, //3o6derAZFQi5v7CZmkZX65eare4xpeVy1ZBpBbiaCA1L, 1715
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
    let mapComponentSubscriptionId= useRef<number | null>(null);

    const playersComponentClient = useRef<Program | null>(null);
    const mapComponentClient = useRef<Program | null>(null);
    const foodComponentClient = useRef<Program | null>(null); 

    const [isMouseDown, setIsMouseDown] = useState(false);
    const [mousePosition, setMousePosition] = useState({x: 0,y: 0});

    const currentPlayerRef = useRef(currentPlayer);
    const exitHoveredRef = useRef(exitHovered);
    const mousePositionRef = useRef(mousePosition);
    const isMouseDownRef = useRef(isMouseDown);

    useEffect(() => {
        currentPlayerRef.current = currentPlayer;
    }, [currentPlayer]);

    useEffect(() => {
        mousePositionRef.current = mousePosition;
    }, [mousePosition]);

    useEffect(() => {
        exitHoveredRef.current = exitHovered;
    }, [exitHovered]);

    useEffect(() => {
        isMouseDownRef.current = isMouseDown;
    }, [isMouseDown]);
    
    const [panelContent, setPanelContent] = useState<JSX.Element | null>(null);
    const [buildViewerNumber, setbuildViewerNumber] = useState(0);
    const [leaderBoardActive, setLeaderboardActive] = useState(false)
    const [isHovered, setIsHovered] = useState([false,false,false,false,false,false]);

   const [gameEnded, setGameEnded] = useState(0);
   const playerCashout = useRef(0);
   const playerBuyIn = useRef(0);
   const [playerTax, setPlayerTax] = useState(0);
   const [playerMouseLocation, setPlayerMouseLocation] = useState({x: 0, y: 0});
   const playerRemovalTimeRef = useRef<BN | null>(null);
   const [cashoutTx, setCashoutTx] = useState<string| null>(null);
   const [reclaimTx, setReclaimTx] = useState<string| null>(null);
   const [cashingOut, setCashingOut] = useState<boolean>(false);
   const [playerCashoutAddy, setPlayerCashoutAddy] = useState<PublicKey| null>(null);
   const nextFood = useRef({x: -1,y: -1});

   const [inputValue, setInputValue] = useState<string>('');  
   const [footerVisible, setFooterVisible] = useState(false);
   const [playerExiting, setPlayerExiting] = useState(false);
   const countdown = useRef(5);
   const [buyIn, setBuyIn] = useState(0.0); 
   const swapAmount = useRef(""); 
   const [tokenMint, setTokenMint] = useState("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"); 

   const [isMobile, setIsMobile] = useState(window.innerWidth < 1000);
   const [selectedOption, setSelectedOption] = useState("Europe");
   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
   const lastUpdateRef = useRef<number | null>(null); // Track the last update time
   const [isCreating, setIsCreating] = useState(false);
   const [joinedOrg, setJoinedOrg] = useState(false);

   const options = ["Europe", "America", "Asia"];

   const SOL_USDC_POOL_ID = "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2"; 
   const SOL_AGLD_POOL_ID = "ExjREqkJQYEd5yJZoCsncAjbHe2SkCUBofztCdTqnPbd";

   let provider = new anchor.AnchorProvider(
    connection,
    new NodeWallet(wallet),
    {
        preflightCommitment: 'processed',
        commitment: 'processed',
    }
    );  
    
    /*
    const providerEphemeralRollup = useRef<anchor.AnchorProvider>(new anchor.AnchorProvider(
        new anchor.web3.Connection("https://supersize-mainnet-sin.magicblock.app", {
        wsEndpoint: "wss://supersize-mainnet-sin.magicblock.app",
        }),
        new NodeWallet(wallet) 
    )); 
    */ 
    
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
            if(fastestEndpoint){
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

    const setInputUsername = (inputUsername: any) => {
        const user = { name: inputUsername, referrer: referrer, referral_done: false};
        localStorage.setItem('user', JSON.stringify(user));
        setPlayerName(inputUsername);
    };

    useEffect(() => {
        const retrievedUser = localStorage.getItem('user');
        if(retrievedUser){
            let myusername = JSON.parse(retrievedUser).name;
            setPlayerName(myusername);
        }
    }, []);

    useEffect(() => {
        if (publicKey) {
            const retrievedUser = localStorage.getItem('user');
            const retrievedRefferal = localStorage.getItem('referrer');
            //console.log('retrieved', member[0], retrievedRefferal, retrievedUser);
            if(member){
                if(member[0]){
                    const user = { name: member[0].account.name, referrer: referrer, referral_done: true};
                    localStorage.setItem('user', JSON.stringify(user));
                    setPlayerName(member[0].account.name);
                    setJoinedOrg(true);
                }
                else{ 
                    if(!retrievedUser || retrievedRefferal !== null){
                        const user = { name: publicKey.toString().slice(0,12), referrer: referrer, referral_done: false};
                        localStorage.setItem('user', JSON.stringify(user));
                        setUsername(publicKey.toString().slice(0,12));
                        setIsReferrerModalOpen(true);
                        setJoinedOrg(false);
                    }
                }
            }
            else{ 
                if(!retrievedUser || retrievedRefferal !== null){
                    const user = { name: publicKey.toString().slice(0,12), referrer: referrer, referral_done: false};
                    localStorage.setItem('user', JSON.stringify(user));
                    setUsername(publicKey.toString().slice(0,12));
                    setIsReferrerModalOpen(true);
                    setJoinedOrg(false);
                }
            }
        }
    }, [member]);

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
        if(activeGames[0]){
            if (buyIn > activeGames[0].max_buyin) {
                setBuyIn(activeGames[0].max_buyin); 
            }
            if (buyIn < activeGames[0].min_buyin){
                setBuyIn(activeGames[0].min_buyin);
            }
        }
    }, [buyIn, activeGames]);

    
    useEffect(() => {
        if(activeGames[0]){
            if(activeGames[0].name == "AGLD"){
                swapAmount.current = "https://raydium.io/swap/?inputMint=sol&outputMint=7dnMwS2yE6NE1PX81B9Xpm7zUhFXmQABqUiHHzWXiEBn"
            }else{
                swapAmount.current = `https://jup.ag/swap/SOL-${tokenMint}`
            }
        }
    }, [activeGames]); 


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
        const newGameInfo : ActiveGame = {worldId: worldId, worldPda: worldPda, name: "loading", active_players: 0, max_players: 0, size: 0, image:`${process.env.PUBLIC_URL}/token.png`, token:"LOADING", base_buyin: 0, min_buyin: 0, max_buyin: 0}
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

    const decodeFood = (data: Uint8Array) => {
        if (!(data instanceof Uint8Array) || data.length !== 4) {
            throw new Error('Invalid food data format. Expected a Uint8Array of length 4.');
        }
        const buffer = data.buffer; // Get the ArrayBuffer from Uint8Array
        const packed = new DataView(buffer).getUint32(data.byteOffset, true); // Little-endian
        const x = packed & 0x3FFF;
        const y = (packed >> 14) & 0x3FFF;
        const size = (packed >> 28) & 0x0F;
        return { x, y, size };
    };

    const updateFoodList = useCallback((section: any, food_index: number) => {
        const foodArray = section.food as any[];  
        const visibleFood: Food[] = [];
        const foodData: Food[] = [];
        foodArray.forEach((foodItem, index) => {
            const foodDataArray = new Uint8Array(foodItem.data);
            const decodedFood = decodeFood(foodDataArray); 
            foodData.push({ 
                x: decodedFood.x, 
                y: decodedFood.y, 
                size: decodedFood.size
            });
            foodData.push({ x: decodedFood.x, y: decodedFood.y, size: decodedFood.size});
            if (currentPlayer) {
                const halfWidth = screenSize.width / 2;
                const halfHeight = screenSize.height / 2;
                const diffX = (decodedFood.x - currentPlayer.x);
                const diffY = (decodedFood.y - currentPlayer.y);
                if (Math.abs(diffX) <= halfWidth && Math.abs(diffY) <= halfHeight) {
                    visibleFood.push({
                        x: diffX + screenSize.width / 2,
                        y: diffY + screenSize.height / 2,
                        size: decodedFood.size,
                    } as Food);
                }
            }
        });
        if(foodData.length>0){
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
            timestamp: performance.now(),
        }));
        setLeaderboard(top10Players);

        if (currentPlayer){
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
          if(currentPlayer && currentItem && currentItem.authority && currentPlayer.authority){
            if (currentItem.authority.equals(currentPlayer.authority)) {
                status += '<span class="me">' + (i + 1) + '. ' + currentItem.name + "</span>";
            } else {
                status += (i + 1) + '. ' + currentItem.name;
            }
          }else {
            status += (i + 1) + '. ' + currentItem.name;
          }
        }
        const statusElement = document.getElementById('status');
        if (statusElement) {
          statusElement.innerHTML = status;
        }
      }, [setLeaderboard,leaderboard]); 

      
    const updateMyPlayerCashout = useCallback((player: any) => {
        console.log('updating cashout data', player);
        playerCashout.current = player.score;
        myReferrer.current = player.referrerTokenAccount;
        setPlayerTax(player.tax);
        setPlayerCashoutAddy(player.payoutTokenAccount)
    }, [setCurrentPlayer, playerKey, allFood]);

    const updateMyPlayer = useCallback((player: any) => {
        if(player.scheduledRemovalTime){
            //console.log(player.scheduledRemovalTime.toNumber() * 1000)
            playerRemovalTimeRef.current = player.scheduledRemovalTime;
        }
        //console.log('elapsed time', elapsedTime)
        if(Math.sqrt(player.mass) == 0 &&
        player.score == 0.0 &&
        !cashingOut &&
        !isJoining){
            const startTime = player.joinTime.toNumber() * 1000;       
            const currentTime = Date.now();
            const elapsedTime = currentTime - startTime;
            if (elapsedTime >= 6000) {
                setGameEnded(1);
                setGameId(null);
            }
        }
        if(playerBuyIn.current == 0
        ){
            playerBuyIn.current = player.buyIn;
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
            timestamp: performance.now(),
            } as Blob);

        if(Math.sqrt(player.mass) == 0 &&
        player.score != 0.0 &&
        !isJoining
        ){
            setCashingOut(true);
            setGameEnded(2);
            setGameId(null);
        }
    }, [setCurrentPlayer, playerKey, allFood]);

    useEffect(() => {
        if(currentPlayer){
        const playersWithAuthority = allplayers.filter(
            (player) =>
                player.authority !== null &&
                player.x !== 50000 &&
                player.y !== 50000 &&
                Math.sqrt(player.mass) !== 0
        );
        updateLeaderboard(playersWithAuthority);
        const newVisiblePlayers: Blob[] = playersWithAuthority.reduce((accumulator: Blob[], playerx) => {
            if (currentPlayer && playerx.authority && currentPlayer.authority){
                if(currentPlayer.authority.toString() != playerx.authority.toString()) {
                const halfWidth = screenSize.width / 2;
                const halfHeight = screenSize.height / 2;
                const diffX = (playerx.x - currentPlayer.x);
                const diffY = (playerx.y - currentPlayer.y);
    
                if (Math.abs(diffX) <= halfWidth && Math.abs(diffY) <= halfHeight) {
                    accumulator.push({
                        name: playerx.name,
                        authority: playerx.authority,
                        x: playerx.x, //diffX + screenSize.width / 2,
                        y: playerx.y, //diffY + screenSize.height / 2,
                        radius: 4 + Math.sqrt(playerx.mass / 10) * 6,
                        mass: playerx.mass,
                        score: playerx.score,
                        tax: playerx.tax,
                        speed: playerx.speed,
                        removal: playerx.removal,
                        target_x: playerx.target_x,
                        target_y: playerx.target_y,
                        timestamp: performance.now(),
                    });
                }
            }
            }
            return accumulator;
        }, []);
        setPlayers(newVisiblePlayers);
        }
      }, [currentPlayer]);

    const updateMap = useCallback((map: any) => {
        const playerArray = map.players as any[];
        //console.log(map); 
        if(map.nextFood){
            const foodDataArray = new Uint8Array(map.nextFood.data);
            const decodedFood = decodeFood(foodDataArray); 
            if(decodedFood.x !== nextFood.current.x || decodedFood.y !== nextFood.current.y){
            //console.log('new food', map.nextFood, nextFood.current);
            nextFood.current = {x: decodedFood.x, y: decodedFood.y};
            //processNewFoodTransaction(map.nextFood.x, map.nextFood.y);
            }
        }else if(map.foodQueue > 0){
            nextFood.current = {x: 0, y: 0};
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
                        timestamp: performance.now(),
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

        if (mapComponentSubscriptionId && mapComponentSubscriptionId.current) await  providerEphemeralRollup.current.connection.removeAccountChangeListener(mapComponentSubscriptionId.current);
        if (myplayerComponentSubscriptionId && myplayerComponentSubscriptionId.current) await  providerEphemeralRollup.current.connection.removeAccountChangeListener(myplayerComponentSubscriptionId.current);
        for (let i = 0; i < foodEntities.current.length; i++) {
            if (foodComponentSubscriptionId && foodComponentSubscriptionId.current) await  providerEphemeralRollup.current.connection.removeAccountChangeListener(foodComponentSubscriptionId.current[i]);
        }
        for (let i = 0; i < playerEntities.current.length; i++) {
            if (playersComponentSubscriptionId && playersComponentSubscriptionId.current) await  providerEphemeralRollup.current.connection.removeAccountChangeListener(playersComponentSubscriptionId.current[i]);
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
            playersComponentSubscriptionId.current = [...playersComponentSubscriptionId.current,providerEphemeralRollup.current.connection.onAccountChange(playersComponenti, (accountInfo) => handlePlayersComponentChange(accountInfo, i), 'processed')];
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
    }, [connection, handlePlayersComponentChange, handleMyPlayerComponentChange,handleFoodComponentChange, handleMapComponentChange, updatePlayers, updateFoodList, updateMap, updateMyPlayer]);

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

            const signature = await sendTransaction(transaction, connection, { minContextSlot});
            await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature }, "processed");

            setTransactionSuccess(`Transaction confirmed`);
            return signature;
            
        } catch (error) {
            setTransactionError(`Transaction failed: ${error}`);
            setIsJoining(false);
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
                setTransactionError('Wallet is not initialized');
                return null;
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
            //console.log(signature);
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
                if(signature){
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

    async function getPriorityFeeEstimate(priorityLevel : string, publicKeys : string[]) {
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
        if (!playerKey){
            setTransactionError("Wallet not connected");
            return;
        }
        if (!publicKey){
            setTransactionError("Wallet not connected");
            return;
        }
        if (isSubmitting) return;
        if (isJoining) return;
        if (selectGameId.name == "loading") return;
        setIsJoining(true);
        setScreenSize({width:selectGameId.size, height:selectGameId.size});
        const gameInfo = selectGameId; 
        let maxplayer=20;
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
        if(mapacc){
            const mapParsedData = mapComponentClient.coder.accounts.decode("map", mapacc.data);
            console.log('map size', mapParsedData.width)
            map_size = mapParsedData.width;
        }
        setMapSize(map_size);
        if(map_size==4000){
            maxplayer=20;
            foodcomponents = 16*5;
        }
        else if(map_size==6000){
            maxplayer=40;
            foodcomponents = 36*5;
        }
        else if(map_size==10000){
            maxplayer=100;
            foodcomponents = 100*5;
        }

        entityMatch.current = mapEntityPda;
        const foodEntityPdas: any[] = [];
        console.log(foodcomponents)

        for (let i = 1; i < foodcomponents+1; i++) {
            const foodseed = 'food' + i.toString(); 
            const foodEntityPda =  FindEntityPda({
                worldId: gameInfo.worldId,
                entityId: new anchor.BN(0),
                seed: foodseed
            })
            foodEntityPdas.push(foodEntityPda);
        }

        const playerEntityPdas: any[] = [];
        const playerClientER = await getComponentsClient(PLAYER_COMPONENT);
        const playerClient = await getComponentsClientBasic(PLAYER_COMPONENT);
        let newplayerEntityPda : any = null;
        let myPlayerId = '';
        let myPlayerStatus = 'new_player';
        let need_to_undelegate = false;
        for (let i = 1; i < maxplayer+1; i++) {
            const playerentityseed = 'player' + i.toString();
            const playerEntityPda =  FindEntityPda({
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
            if(playersacc){
                const playersParsedData = playerClient.coder.accounts.decode("player", playersacc.data);
                if(playersacc.owner.toString() === "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"){
                    if(playersParsedData.authority !== null){
                        if(playersaccER){
                            const playersParsedDataER = playerClientER.coder.accounts.decode("player", playersaccER.data);
                            if(playersParsedData.authority.toString() == playerKey.toString()){
                                if(playersParsedDataER.authority){
                                if(playersParsedDataER.authority.toString() == playerKey.toString()){
                                    myPlayerStatus = "resume_session";
                                    newplayerEntityPda = playerEntityPda;
                                    myPlayerId = playerentityseed;
                                    need_to_undelegate=false;
                                }
                                else{
                                    myPlayerStatus = "rejoin_session";
                                    newplayerEntityPda = playerEntityPda;
                                    myPlayerId = playerentityseed;
                                    need_to_undelegate=false;
                                }
                                }else{
                                    myPlayerStatus = "rejoin_session";
                                    newplayerEntityPda = playerEntityPda;
                                    myPlayerId = playerentityseed;
                                    need_to_undelegate=false;
                                }
                            }else{
                                if(playersParsedDataER.authority == null && 
                                    playersParsedData.authority !== null && 
                                    playersParsedDataER.x == 50000 &&
                                    playersParsedDataER.y == 50000 &&
                                    playersParsedDataER.score == 0 && 
                                    newplayerEntityPda == null
                                ){
                                    const startTime = playersParsedDataER.joinTime.toNumber() * 1000;       
                                    const currentTime = Date.now();
                                    const elapsedTime = currentTime - startTime;
                                    if (elapsedTime >= 10000) {
                                        newplayerEntityPda = playerEntityPda;
                                        myPlayerId = playerentityseed;
                                        need_to_undelegate=true;
                                    }
                                }
                            }
                        }else if(playersParsedData.authority !== null){
                            if(playersParsedData.authority.toString() == playerKey.toString()){
                                myPlayerStatus = "rejoin_session";
                                newplayerEntityPda = playerEntityPda;
                                myPlayerId = playerentityseed;
                                need_to_undelegate=false;
                            }
                        }
                    }
                }
                else if(playersParsedData.authority == null && newplayerEntityPda == null){
                    newplayerEntityPda = playerEntityPda;
                    myPlayerId = playerentityseed;
                    need_to_undelegate=false;
                }
                else{
                if(playersParsedData.authority !== null){
                    if(playersParsedData.authority.toString() == playerKey.toString()){
                        myPlayerStatus = "rejoin_undelegated";
                        newplayerEntityPda = playerEntityPda;
                        myPlayerId = playerentityseed;
                        need_to_undelegate=false;
                    }
                } 
                }
            }
            else{
                if(newplayerEntityPda == null){
                    newplayerEntityPda = playerEntityPda;
                    myPlayerId = playerentityseed;
                    need_to_undelegate=false;
                }
            }
            }
            console.log('my player', myPlayerId, myPlayerStatus);

            const playerComponentPda = FindComponentPda({
                componentId: PLAYER_COMPONENT,
                entity: newplayerEntityPda,
            });
            console.log('component pda', playerComponentPda.toString())

            if(need_to_undelegate){
                try {
                    const undelegateIx = createUndelegateInstruction({
                        payer: playerKey,
                        delegatedAccount: playerComponentPda,
                        componentPda: PLAYER_COMPONENT,
                        });
                    let undeltx = new anchor.web3.Transaction()
                    .add(undelegateIx);
                    undeltx.recentBlockhash = (await providerEphemeralRollup.current.connection.getLatestBlockhash()).blockhash;
                    undeltx.feePayer = walletRef.current.publicKey;
                    undeltx.sign(walletRef.current);
                    //undeltx = await providerEphemeralRollup.current.wallet.signTransaction(undeltx);
                    const playerundelsignature = await providerEphemeralRollup.current.sendAndConfirm(undeltx, [], { skipPreflight: false });
                    console.log('undelegate', playerundelsignature);
                } catch (error) {
                    console.log('Error undelegating:', error);
                }
            }

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
            const anteComponentClient= await getComponentsClient(ANTEROOM_COMPONENT);
            const anteacc = await provider.connection.getAccountInfo(
                anteComponentPda, "processed"
            );
            
            let token_account_owner_pda = new PublicKey(0);
            let vault_token_account = new PublicKey(0);
            let mint_of_token_being_sent = new PublicKey(0);
            let sender_token_account = new PublicKey(0);
            let payout_token_account = new PublicKey(0);
            let vault_program_id = new PublicKey("BAP315i1xoAXqbJcTT1LrUS45N3tAQnNnPuNQkCcvbAr");
            let referral_vault_program_id = new PublicKey("CLC46PuyXnSuZGmUrqkFbAh7WwzQm8aBPjSQ3HMP56kp");
            const combinedTx = new Transaction();

            if(anteacc){
                const anteParsedData = anteComponentClient.coder.accounts.decode("anteroom", anteacc.data);
                vault_token_account = anteParsedData.vaultTokenAccount;
                mint_of_token_being_sent = anteParsedData.token;
                let usertokenAccountInfo = await getAssociatedTokenAddress(
                    mint_of_token_being_sent,        
                    publicKey       
                  ); 
                payout_token_account = usertokenAccountInfo;
                const { name, image } = await fetchTokenMetadata(mint_of_token_being_sent.toString());
                console.log("token", name);
                
                try{
                    await axios.post("https://supersize.lewisarnsten.workers.dev/create-contest", {
                        name: name,
                        tokenAddress: mint_of_token_being_sent.toString()
                    })
                }catch(error){
                    console.log('error', error)
                }
                try{
                    await axios.post("https://supersize.lewisarnsten.workers.dev/create-user", {
                        walletAddress: publicKey.toString(),
                        contestId: name,
                        name: publicKey.toString(),
                    })
                }catch(error){
                    console.log('error', error)
                }
                
                /*
                const playerbalance = await connection.getBalance(playerKey, 'processed');
                let targetBalance = 0.002 * LAMPORTS_PER_SOL;
                const amountToTransfer = targetBalance > playerbalance ? targetBalance - playerbalance : 0;
                console.log(amountToTransfer);
                if(amountToTransfer > 0){
                    const soltransfertx = SystemProgram.transfer({
                        fromPubkey: publicKey,
                        toPubkey: playerKey,
                        lamports: amountToTransfer, 
                    });
                    
                    combinedTx.add(soltransfertx);
                } */
                }else{
                    setTransactionError("Failed to find game token info");
                    return;
                }

                if(myPlayerStatus !== "rejoin_undelegated" && myPlayerStatus !== "resume_session" && myPlayerStatus !== "rejoin_session"){
                    let [referralTokenAccountOwnerPda] = PublicKey.findProgramAddressSync(
                        [Buffer.from("token_account_owner_pda"), mint_of_token_being_sent.toBuffer()],
                        referral_vault_program_id
                        );
                    const referraltokenVault = await getAssociatedTokenAddress(mint_of_token_being_sent, referralTokenAccountOwnerPda, true);
                    
                    const BUDDY_LINK_PROGRAM_ID = new PublicKey("BUDDYtQp7Di1xfojiCSVDksiYLQx511DPdj2nbtG9Yu5");

                    let buddyMemberPdaAccount : PublicKey;
                    let memberName = "notmembersalt";
                    if(joinedOrg){
                        /* const [memberPDA] = PublicKey.findProgramAddressSync(
                            [
                              Buffer.from("member_"),
                              Buffer.from("test"),
                              Buffer.from("_"),
                              Buffer.from(member[0].account.name),
                            ],
                            BUDDY_LINK_PROGRAM_ID
                          );     */ 
                        //console.log(memberPDA.toString());   
                        memberName = member[0].account.name;        
                        buddyMemberPdaAccount = getMemberPDA(BUDDY_LINK_PROGRAM_ID, "supersize", member[0].account.name);
                    }else{
                        buddyMemberPdaAccount = getMemberPDA(BUDDY_LINK_PROGRAM_ID, "supersize", memberName);
                    }
                    //console.log(buddyMemberPdaAccount.toString());

                    let [refferalPdaAccount] = PublicKey.findProgramAddressSync(
                        [Buffer.from("subsidize"), buddyMemberPdaAccount.toBuffer(), mint_of_token_being_sent.toBuffer()],
                        referral_vault_program_id
                        );
                    console.log(referralTokenAccountOwnerPda.toString(), referraltokenVault.toString())
                    let applyBuyInSystem = await ApplySystem({
                    authority: publicKey,
                    world: gameInfo.worldPda,
                    entities: [
                      {
                        entity: newplayerEntityPda,
                        components: [{ componentId:PLAYER_COMPONENT}],
                      },
                      {
                        entity: anteEntityPda,
                        components: [{ componentId:ANTEROOM_COMPONENT }],
                      },
                    ], 
                    systemId: BUY_IN,
                    args: {
                        buyin: buyIn,
                        member_name: memberName,
                    },
                    extraAccounts: [
                        {
                          pubkey: vault_token_account,
                          isWritable: true,
                          isSigner: false,
                        },
                        {
                          pubkey: playerKey, 
                          isWritable: true,
                          isSigner: false,
                        },
                        {
                            pubkey: payout_token_account, 
                            isWritable: true,
                            isSigner: false,
                          }, 
                        {
                            pubkey: referraltokenVault, 
                            isWritable: true,
                            isSigner: false,
                            },
                        {
                            pubkey: referralTokenAccountOwnerPda, 
                            isWritable: true,
                            isSigner: false,
                            },
                        {
                                pubkey: refferalPdaAccount, 
                                isWritable: true,
                                isSigner: false,
                            }, 
                        {
                                pubkey: buddyMemberPdaAccount, 
                                isWritable: true,
                                isSigner: false,
                            }, 
                        {
                            pubkey: publicKey,
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
                combinedTx.add(applyBuyInSystem.transaction);                  
            }

            if(myPlayerStatus !== "resume_session"){
                try {
                    const playerdeltx = new anchor.web3.Transaction();
                    const playerdelegateIx = createDelegateInstruction({
                    entity: newplayerEntityPda,
                    account: playerComponentPda,
                    ownerProgram: PLAYER_COMPONENT,
                    payer: publicKey,
                    });
                    combinedTx.add(playerdelegateIx)
                    const playerdelsignature = await submitTransactionUser(combinedTx);
                    console.log(
                        `Delegation signature: ${playerdelsignature}`
                    );
                    const acc = await providerEphemeralRollup.current.connection.getAccountInfo(
                        playerComponentPda
                    );
                    if(acc){
                    console.log('confirm del', acc.owner.toString());
                    }
                } catch (error) {
                    console.log('Error delegating:', error);
                    {/* const reclaim_transaction = new Transaction();
                    const playerbalance = await connection.getBalance(playerKey, 'processed');
                    const solTransferInstruction = SystemProgram.transfer({
                        fromPubkey: playerKey,
                        toPubkey: publicKey,
                        lamports: playerbalance - 1500000,
                    });
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
                    ); */}
                    setTransactionError("Buy in failed, please retry");
                    setIsSubmitting(false);
                    setIsJoining(false);
                    return;
                }
            }

            const applySystem = await ApplySystem({
                authority: playerKey,
                world: gameInfo.worldPda,
                entities: [
                  {
                    entity: newplayerEntityPda,
                    components: [{ componentId:PLAYER_COMPONENT}],
                  },
                  {
                    entity: mapEntityPda,
                    components: [{ componentId:MAP_COMPONENT }],
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
            jointransaction.recentBlockhash = blockhash;
            jointransaction.feePayer = walletRef.current.publicKey;
            jointransaction.sign(walletRef.current);
            let signature = await providerEphemeralRollup.current.connection.sendRawTransaction(
                jointransaction.serialize(), 
                { skipPreflight: true } 
            ).catch((error) => {
                   console.log(error)
            });
            console.log('joined game', signature);
            
            const startTime = Date.now();
            while (Date.now() - startTime < 5000) {
              const playersacc = await providerEphemeralRollup.current.connection.getAccountInfo(playerComponentPda, "processed");
              if (playersacc) {
                const playersParsedData = playerClientER.coder.accounts.decode("player", playersacc.data);
                if (playersParsedData.authority !== null && playersParsedData.mass !== 0) {
                    break; 
                }
              }
              signature = await providerEphemeralRollup.current.connection.sendRawTransaction(
                jointransaction.serialize(), 
                { skipPreflight: true } 
              ).catch((error) => {
                    console.log(error)
              });
              await new Promise(resolve => setTimeout(resolve, 1000)); 
            }

            if (signature) {
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
                    timestamp: 0,
                }; 
                setAllPlayers(new Array(playerEntityPdas.length).fill(emptyPlayer));
                setAllFood(new Array(foodEntityPdas.length).fill([]));
                setFoodListLen(new Array(foodEntityPdas.length).fill(0));
                await subscribeToGame(); 
                //setTimeout(() => {
                setIsJoining(false);
                //}, 5000);
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
        if (!playerKey){
            setTransactionError('Wallet is not initialized');
            return null;
        }
        if(currentWorldId.current==null){
            setTransactionError('world not found');
            return null;
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
        if (!playerKey){
            setTransactionError('Wallet is not initialized');
            return null;
        }
        if(currentWorldId.current==null){
            setTransactionError('world not found');
            return null;
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
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = walletRef.current.publicKey;
        transaction.sign(walletRef.current);
        setCashingOut(true);
        try {
            const signature = await providerEphemeralRollup.current.sendAndConfirm(transaction); 
            console.log('exiting', signature)
            if (signature != null) {
                setGameId(null);
                setGameEnded(2);
            }
        } catch (error) {
            console.log('Error cashing out:', error);
        }
        //const signature = await providerEphemeralRollup.current.sendAndConfirm(transaction); 
        
    }, [playerKey, submitTransaction, subscribeToGame]);


    const cleanUp = async () => {
        //currentPlayer.x === 50000 &&
        //currentPlayer.y === 50000 && 
        if (
            currentPlayer &&
            Math.sqrt(currentPlayer.mass) == 0 &&
            ((cashingOut && gameEnded==2) ||
            !cashingOut)
        ) {
            if(currentWorldId.current==null){
                setTransactionError('world not found');
                return;
            }
            //console.log(currentPlayer)
            if(currentPlayerEntity.current && anteroomEntity.current && entityMatch.current){
                console.log('cashing out')
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
                tx.recentBlockhash = (await providerEphemeralRollup.current.connection.getLatestBlockhash()).blockhash;
                tx.feePayer = walletRef.current.publicKey;
                tx.sign(walletRef.current);
                try {
                    const playerdelsignature = await providerEphemeralRollup.current.sendAndConfirm(tx, [], { skipPreflight: false });
                    /*await waitSignatureConfirmation(
                        playerdelsignature,
                        providerEphemeralRollup.current.connection,
                        "finalized"
                    );*/
                    console.log('undelegate', playerdelsignature)
                } catch (error) {
                    console.log('Error undelegating:', error);
                }

                const anteComponentPda = FindComponentPda({
                    componentId: ANTEROOM_COMPONENT,
                    entity: anteroomEntity.current,
                });
                const anteComponentClient= await getComponentsClient(ANTEROOM_COMPONENT);
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
        
                if(anteacc && savedPublicKey){
                    const anteParsedData = anteComponentClient.coder.accounts.decode("anteroom", anteacc.data);
                    vault_token_account = anteParsedData.vaultTokenAccount;
                    mint_of_token_being_sent = anteParsedData.token;
                    owner_token_account = anteParsedData.gamemasterTokenAccount;
                    const { name, image } = await fetchTokenMetadata(mint_of_token_being_sent.toString());
                    console.log('win amount', (playerCashout.current * 0.98) - playerBuyIn.current, playerCashout.current, playerBuyIn.current);
                    
                    try {
                        await axios.post('https://supersize.lewisarnsten.workers.dev/update-wins', {
                            walletAddress: savedPublicKey?.toString(),
                            amount: (playerCashout.current * 0.98) - playerBuyIn.current,
                            contestId: name
                        })
                    }catch(error){
                        console.log('error', error)
                    } 
                    
                    //supersize_token_account = anteParsedData.gamemasterTokenAccount;
                    supersize_token_account = await getAssociatedTokenAddress(mint_of_token_being_sent, new PublicKey("DdGB1EpmshJvCq48W1LvB1csrDnC4uataLnQbUVhp6XB"));
                    let usertokenAccountInfo = await getAssociatedTokenAddress(
                        mint_of_token_being_sent,       
                        savedPublicKey     
                      ); 
                    sender_token_account = usertokenAccountInfo;
                    let [tokenAccountOwnerPda] = PublicKey.findProgramAddressSync(
                        [Buffer.from("token_account_owner_pda"), mapComponent.toBuffer()],
                        vault_program_id
                        );
                    if (playerCashoutAddy){
                        sender_token_account = playerCashoutAddy;
                    }
                   if(cashingOut && gameEnded==2){
                    setCashoutTx(null);
                    let referrer_token_account = null;
                    if(myReferrer.current){
                        referrer_token_account = new PublicKey(myReferrer.current);
                    }
                    const extraAccounts = referrer_token_account ? [
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
                          pubkey: savedPublicKey,
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
                      ] : [
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
                          pubkey: savedPublicKey,
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
                      ]

                    const applyCashOutSystem = await ApplySystem({
                        authority: savedPublicKey,
                        world: currentWorldId.current,
                        entities: [
                          {
                            entity: currentPlayerEntity.current,
                            components: [{ componentId:PLAYER_COMPONENT}],
                          },
                          {
                            entity: anteroomEntity.current,
                            components: [{ componentId:ANTEROOM_COMPONENT }],
                          },
                        ], 
                        systemId: CASH_OUT,
                        args: {
                            referred: false,
                        },
                        extraAccounts: extraAccounts
                        /*[
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
                              pubkey: savedPublicKey,
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
                          ]*/,
                      });
                    const cashouttx = new anchor.web3.Transaction().add(applyCashOutSystem.transaction); 
                    const cashoutsignature = await submitTransactionUser(cashouttx);

                    console.log('cashout', cashoutsignature);
                    if (cashoutsignature){
                        setCashoutTx(cashoutsignature);
                        playersComponentSubscriptionId.current = [];
                        currentPlayerEntity.current = null;
                        entityMatch.current = null;
                        foodEntities.current = [];
                        setPlayers([]);
                        setAllFood([]);
                        setFoodListLen([]);
                        setGameId(null);
                    }else{
                        setCashoutTx("error");
                        setTransactionError("Error cashing out, please retry");
                        return;
                    }
                    }else{
                        playersComponentSubscriptionId.current = [];
                        currentPlayerEntity.current = null;
                        entityMatch.current = null;
                        foodEntities.current = [];
                        setPlayers([]);
                        setAllFood([]);
                        setFoodListLen([]);
                        setGameId(null);
                    }
                    
                    /*const reclaim_transaction = new Transaction(); //.add(computePriceIx);
                    const playerbalance = await connection.getBalance(playerKey, 'processed');
                    const solTransferInstruction = SystemProgram.transfer({
                        fromPubkey: playerKey,
                        toPubkey: savedPublicKey,
                        lamports: playerbalance - 1000000,
                    });
                    reclaim_transaction.add(solTransferInstruction);
                    const computePriceIx = ComputeBudgetProgram.setComputeUnitPrice({
                        microLamports: 1000002,
                    });
                    const computeLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
                        units: 10_000,
                    });
                    reclaim_transaction.add(computePriceIx).add(computeLimitIx);
                    const reclaimsig = await submitTransaction(reclaim_transaction, "confirmed", true);
                    console.log("Reclaim SOL", reclaimsig, playerbalance);

                    if(reclaimsig){
                        setReclaimTx(reclaimsig);
                    }else{
                        setTransactionError("Error reclaiming SOL");
                        //setGameEnded(4);
                    }*/
                }
                }
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

    useEffect(() => {
        cleanUp();
    }, [gameEnded]);

    useEffect(() => {
        if(currentPlayer){
        const visibleFood = allFood.map((foodList) => {
            return foodList.reduce<Food[]>((innerAcc, foodItem) => {
                const diffX = foodItem.x - currentPlayer.x;
                const diffY = foodItem.y - currentPlayer.y;
                if (Math.abs(diffX) <= screenSize.width / 2 && Math.abs(diffY) <= screenSize.height / 2) {
                    innerAcc.push({
                        x: foodItem.x, // - currentPlayer.x + screenSize.width / 2,
                        y: foodItem.y, //- currentPlayer.y + screenSize.height / 2
                        size: foodItem.size
                    });
                }
                return innerAcc;
            }, []);
        });     
        //console.log(visibleFood);   
        setVisibleFood(visibleFood);
        }
    }, [currentPlayer]);

    const handleMovementAndCharging = async () => {
        const currentPlayer = currentPlayerRef.current;
        const mousePosition = mousePositionRef.current;
        const isMouseDown = isMouseDownRef.current;
        const exitHovered = exitHoveredRef.current;

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
                //setPlayerMouseLocation({x: newX, y: newY});

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
                if(playerstoeat){
                    let playersListIndex = findListIndex(playerstoeat);
                    if(playersListIndex != null){
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

                let {food_x, food_y } = getClampedFoodPosition(currentPlayer.x, currentPlayer.y, newX, newY, currentPlayer.radius, mapSize, mapSize);
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
    
                alltransaction.recentBlockhash = blockhash;
                alltransaction.feePayer = walletRef.current.publicKey;
                alltransaction.sign(walletRef.current);
                let signature = await processSessionEphemTransaction(alltransaction).catch((error) => {
                    console.log(error)
                });
                lastUpdateRef.current = performance.now();
                //console.log(currentPlayer.target_x, newX);
                //console.log(currentPlayer.target_y, newY);
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
        
        return () => { clearInterval(intervalId); }
    }, [gameId]);

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
        if(currentPlayer?.radius){
            const centerX = screenSize.width / 2;
            const centerY = screenSize.height / 2;
        
            for (const player of visiblePlayers) {
                const distance = Math.sqrt((player.x - currentPlayer.x) ** 2 + (player.y - currentPlayer.y) ** 2);
                if (distance < currentPlayer.radius) {
                    return player.authority;
                }
            }
        }
        return null;
    };

    const checkFoodDistances = (visibleFood: { x: number, y: number }[], screenSize: { width: number, height: number }) => {
        if(currentPlayer?.radius){
            const centerX = screenSize.width / 2;
            const centerY = screenSize.height / 2;
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
        const row = Math.floor(adjustedY / sectionSize); 
        const col = Math.floor(adjustedX / sectionSize); 
        let baseIndex = row * sectionsPerRow + col;
        let food_indices : number[] = [];
        for (let i = 0; i < duplicateEncodings; i++) {
            food_indices.push(baseIndex + i * mapSectionCount)
        }

        return food_indices;
    }

    const processNewFoodTransaction = async (foodX : number, foodY : number) => {
        if(currentWorldId.current !== null){
        const allTransaction = new anchor.web3.Transaction();
        if(currentPlayerEntity.current && entityMatch.current){
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
            if(mapacc){
                const mapParsedData = mapComponentClient.current?.coder.accounts.decode("map", mapacc?.data);
                if(mapParsedData.nextFood != null){
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
            if (signature){
                await waitSignatureConfirmation(
                    signature,
                    providerEphemeralRollup.current.connection,
                    "finalized"
                  );
            }
        } catch (error) {
            //console.log("Transaction failed", error);
        }
        }
        }
    };

    const handleExitClick = () => {
        if(playerRemovalTimeRef.current !== null){
            const currentTime = Date.now();
            const elapsedTime = currentTime - playerRemovalTimeRef.current.toNumber() * 1000;
            if (elapsedTime > 10000 || elapsedTime < 5000) {
                preExitGameTx();
            }
            else{
                return;
            }
        }

        countdown.current = 5;
        setPlayerExiting(true);
        preExitGameTx().then(() => {
            if(currentPlayerEntity.current){
            const myplayerComponent = FindComponentPda({
                componentId: PLAYER_COMPONENT,
                entity: currentPlayerEntity.current,
            });
            (playersComponentClient.current?.account as any).player.fetch(myplayerComponent, "processed").then(updateMyPlayer).catch((error: any) => {
                console.error("Failed to fetch account:", error);
            });
            }
        });

        const interval = setInterval(() => {
            countdown.current -= 1;
        }, 1000);
        
        let startTime = Date.now();
        const checkRemovalTime = setInterval(() => {
            if (playerRemovalTimeRef.current && !playerRemovalTimeRef.current.isZero()) {
              startTime = playerRemovalTimeRef.current.toNumber() * 1000; 
              clearInterval(checkRemovalTime); 
        
              const timeoutinterval = setInterval(() => {
                if (playerRemovalTimeRef.current){
                startTime = playerRemovalTimeRef.current.toNumber() * 1000; 
                }
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
          }, 100); 
      };
      
    useEffect(() => {
        if(entityMatch || gameId){
            const handleMouseMove = (event: MouseEvent) => {
                setMousePosition({x:event.clientX, y: event.clientY});
                if(currentPlayer){
                    const newX = Math.max(0, Math.min(screenSize.width, Math.floor(currentPlayer.x + event.clientX - window.innerWidth / 2)));
                    const newY = Math.max(0, Math.min(screenSize.height, Math.floor(currentPlayer.y + event.clientY - window.innerHeight / 2)));
                    setPlayerMouseLocation({x: newX - currentPlayer.x, y: newY - currentPlayer.y});
                }
            }; 

            const handleMouseDown = (event: MouseEvent) => { 
                setIsMouseDown(true);
            };

            const handleMouseUp = () => {
                setIsMouseDown(false);
            };
            
            console.log('Set mouse listeners');
            window.addEventListener('mousedown', handleMouseDown);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('mousemove', handleMouseMove);

            return () => {
                console.log('Remove mouse listeners');
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mousedown', handleMouseDown);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [playerKey, gameId, entityMatch, screenSize]);

    useEffect(() => {        
        function translateLargerRectangle() {
            const largerRectangle = document.getElementsByClassName('game')[0] as HTMLElement;;
            const smallerRectangle = document.getElementsByClassName('gameWrapper')[0] as HTMLElement;;
        
            if (largerRectangle && smallerRectangle) {
                const widthLarger = screenSize.width*scale;
                const heightLarger = screenSize.height*scale;
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
                const  devnet_connection =  new Connection("https://proud-late-lambo.solana-devnet.quiknode.pro/ec12ab7b183190f9cfd274049f6ab83396c22e7d"); 
                const recentSamples = await devnet_connection.getRecentPerformanceSamples(4);
                const totalTransactions = recentSamples.reduce((total, sample) => total + sample.numTransactions, 0);
                const averageTransactions = totalTransactions / recentSamples.length;
                setCurrentTPS(Math.round(averageTransactions));
        };
        getTPS();
      }, []);

        async function getTokenBalance(connection: Connection, vault: PublicKey, decimals: number): Promise<number> {
        const balance = await connection.getTokenAccountBalance(vault);
        return parseFloat(balance.value.amount) / Math.pow(10, decimals); 
        }
        async function parsePoolInfo(poolId: string) {
        const  mainnet_connection =  new Connection("https://floral-convincing-dawn.solana-mainnet.quiknode.pro/73d5d52678fd227b48dd0aec6a8e94ac9dd61f59"); 
        const info = await mainnet_connection.getAccountInfo(new PublicKey(poolId));
        if (!info) return;
        const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(info.data);        
        const baseTokenDecimals = 9; 
        const quoteTokenDecimals = 6; 
        const baseTokenBalance = await getTokenBalance(mainnet_connection, poolState.baseVault, baseTokenDecimals);
        const quoteTokenBalance = await getTokenBalance(mainnet_connection, poolState.quoteVault, quoteTokenDecimals);        
        const priceOfBaseInQuote = quoteTokenBalance / baseTokenBalance;
        return priceOfBaseInQuote;
        }

        useEffect(() => {
            const fetchPrice = async () => {
                try {
                    let priceOfBaseInQuote = await parsePoolInfo(SOL_USDC_POOL_ID);
                    if (priceOfBaseInQuote) {
                        setPrice(priceOfBaseInQuote);
                    }
                } catch (error) {
                    console.error("Error fetching price:", error);
                }
            };
            fetchPrice(); // Call the async function
        }, []);

        const handleClick = (index: number) => {
        setOpenGameInfo(prevState => {
            const newState = [...prevState];
            newState[index] = !newState[index];
            return newState;
        });
        };

        const handleBuyClick = () => {
            window.open(swapAmount.current, "_blank", "noopener,noreferrer");
        };

        const handleImageClick = async () => {
            if (inputValue.trim() !== '') {
                try {
                    const worldId = {worldId: new anchor.BN(inputValue.trim())};
                    const worldPda = await FindWorldPda( worldId);
                    const newGameInfo : ActiveGame = {worldId: worldId.worldId, worldPda: worldPda, name: "loading", active_players: 0, max_players: 0, size: 0, image:"", token:"", base_buyin: 0, min_buyin: 0, max_buyin: 0}
                    console.log('new game info', newGameInfo.worldId,newGameInfo.worldPda.toString())
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

        const fetchTokenMetadata = async (tokenAddress: string): Promise<{ name: string; image: string }> => {
            try {
              const response = await fetch(`https://devnet.helius-rpc.com/?api-key=07a045b7-c535-4d6f-852b-e7290408c937`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  jsonrpc: "2.0",
                  id: 1, // Unique identifier
                  method: "getAsset",
                  params: [tokenAddress], // Token address passed in an array
                }),
              });
          
              if (!response.ok) {
                const errorText = await response.text();
                console.error("Error fetching asset:", errorText);
                throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
              }
          
              const data = await response.json();
              
              if (data.error) {
                throw new Error(data.error.message);
              }
          
              const content = data.result?.content;
              if (!content) {
                throw new Error("Content not found in response");
              }

              // Check if json_uri is present and not empty
              const jsonUri = content.json_uri;
              if (jsonUri) {
                const metadataResponse = await fetch(jsonUri);
                if (!metadataResponse.ok) {
                  const errorText = await metadataResponse.text();
                  console.error("Error fetching metadata from json_uri:", errorText);
                  throw new Error(`HTTP Error: ${metadataResponse.status} ${metadataResponse.statusText}`);
                }
                const metadataJson = await metadataResponse.json();
                return {
                  name: metadataJson.name || "Unknown",
                  image: metadataJson.image || "",
                };
              }
          
              // Fallback to metadata from content if json_uri is empty
              const name = content.metadata?.symbol || "Unknown";
              const image = content.links?.image || content.files?.[0]?.uri || "";
          
              return { name, image };
            } catch (error) {
              console.error("Error fetching token metadata:", error);
              throw error;
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
                    let base_buyin = 0;
                    let min_buyin = 0;
                    let max_buyin = 0;
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
                    const anteComponentClient= await getComponentsClient(ANTEROOM_COMPONENT);
                    const anteacc = await provider.connection.getAccountInfo(
                        anteComponentPda, "processed"
                    );
                    let mint_of_token_being_sent = new PublicKey(0);
                    if(anteacc){
                        const anteParsedData = anteComponentClient.coder.accounts.decode("anteroom", anteacc.data);
                        //console.log(anteParsedData)
                        mint_of_token_being_sent = anteParsedData.token;
                        base_buyin = anteParsedData.baseBuyin;
                        max_buyin = anteParsedData.maxBuyin;
                        min_buyin = anteParsedData.minBuyin;
                        setTokenMint(mint_of_token_being_sent.toString());
                        if(mint_of_token_being_sent.toString() === "7dnMwS2yE6NE1PX81B9Xpm7zUhFXmQABqUiHHzWXiEBn"){
                            token_image = `${process.env.PUBLIC_URL}/agld.jpg`;
                            token_name = "AGLD";
                        }else{
                            //token_image = `${process.env.PUBLIC_URL}/usdc.png`;
                            //token_name = "USDC";
                            try {
                                //console.log(mint_of_token_being_sent.toString())
                                const { name, image } = await fetchTokenMetadata(mint_of_token_being_sent.toString());
                                //console.log('metadata', name, image)
                                token_image = image;
                                token_name = name;
                            } catch (error) {
                                console.error("Error fetching token data:", error);
                            }
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
                        let activeplayers=0;
                        for (let player_index = 1; i < mapParsedData.maxPlayers+1; player_index++) {
                            const playerentityseed = 'player' + player_index.toString();
                            const playerEntityPda =  FindEntityPda({
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
                            if(playersacc){
                                const playersParsedData = playerClient.coder.accounts.decode("player", playersacc.data);
                                //console.log(playersParsedData)
                                if(playersParsedData.authority != null){
                                    activeplayers = activeplayers + 1;
                                }
                            }else{
                                break;
                            }
                        }
                        setActiveGames(prevActiveGames => {
                            const updatedGames = prevActiveGames.map(game =>
                                game.worldId === activeGames[i].worldId && game.worldPda.toString() === activeGames[i].worldPda.toString()
                                    ? { ...game, name: mapParsedData.name, active_players: activeplayers, max_players: mapParsedData.maxPlayers, size: mapParsedData.width, image: token_image, token: token_name, base_buyin: base_buyin, min_buyin: min_buyin, max_buyin: max_buyin } 

                                    : game
                            );
                            return updatedGames;
                        });
                    } else {
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
        if(buildViewerNumber == 0 || buildViewerNumber == 1){
        const handleWheel = (event: WheelEvent) => {
          scrollY += event.deltaY;
      
          const element = document.querySelector('.info-text-container');
          let scrollTop = 0;
          if (element) {
            scrollTop = element.scrollTop;
          }
          scrollY += event.deltaY;

          if (scrollY > 20 && !element) {
            setbuildViewerNumber(1);
          } else if (scrollY < -20 && scrollTop === 0 && element) {
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
        <div className={`supersize ${isReferrerModalOpen ? "background-dim" : ""}`}>
        <div className="topbar" style={{display: gameId == null && gameEnded == 0 && buildViewerNumber != 9 ? 'flex' : 'none',background: buildViewerNumber==1 ? "rgba(0, 0, 0, 0.3)" : "rgb(0, 0, 0)",height: isMobile && buildViewerNumber == 1 ? '20vh' : buildViewerNumber == 1 ? '10vh' : '4vh', zIndex: 9999999}}>
            {buildViewerNumber == 0 ? (
                <>
                <div
                    className="dropdown-container"
                    onClick={() => setIsDropdownOpen((prev) => !prev)} 
                >
                    <div className={`selected-option ${isDropdownOpen ? "open" : ""}`}>
                        <span className="dot green-dot" /> 
                        {selectedOption}
                    </div>

                    {isDropdownOpen && (
                        <div className="dropdown-menu">
                            {options
                                .filter((option) => option !== selectedOption)
                                .map((option) => (
                                    <div
                                        key={option}
                                        className="dropdown-item"
                                        onClick={(e) => {
                                            e.stopPropagation(); 
                                            handleOptionClick(option);
                                        }}
                                    >
                                        <span className="dot red-dot" />
                                        <span className="dropdown-text"> {option} </span>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
                <span className="free-play" style={{color:"#FFEF8A", borderColor:"#FFEF8A", marginLeft:"0vw", width:"fit-content", paddingLeft:"10px", paddingRight:"10px", marginTop:"5vh", background:"black"}}>Supersize is an eat or be eaten multiplayer game, live on the Solana blockchain</span>
                </>
            ) : 
               (
                <div>
                <>
                    {buildViewerNumber ==1 ?
                        (   
                             <span className="titleText" style={{cursor:"pointer"}} onClick={(e) => {e.stopPropagation(); setbuildViewerNumber(0);}}> SUPERSIZE </span>
                        )     
                        : (        
                        <div>
                        <>
                        <div
                            style={{
                                width: '4vh',
                                height: '4vh',
                                display: 'flex',
                                cursor: "pointer",
                                alignItems : "center", 
                                justifyContent:"center",
                                marginLeft:"2vw",
                                marginTop:"4vh"
                            }}
                            onMouseEnter={() => setIsHovered([false,false,false,false,false,true])}
                            onMouseLeave={() => setIsHovered([false,false,false,false,false,false])}
                            onClick={() => {setbuildViewerNumber(0); setIsHovered([false,false,false,false,false]);}}
                            >
                            <img
                                src={`${process.env.PUBLIC_URL}/home.png`}
                                width="35px"
                                height="auto"
                                alt="Image"
                                style={{
                                    position: "absolute",
                                    opacity: isHovered[5] ? 0.2 : 0.8,
                                    transition: 'opacity 0.0s ease background 0.3s ease 0s, color 0.3s ease 0s',
                                }}
                            />
                            {isHovered[5] && (
                                <img
                                src={`${process.env.PUBLIC_URL}/homehighlight.png`}
                                width="35px"
                                height="auto"
                                alt="Highlighted Image"
                                style={{
                                    position: 'absolute',
                                    opacity: isHovered[5] ? 0.8 : 0.2,
                                    transition: 'opacity 0.3s ease',
                                }}
                                />
                            )}
                        </div>
                        </>
                        </div>)}
                    </>
                </div>)
            }
            <div className="left-side" style={{alignItems : "center", justifyContent:"center", display: 'flex', zIndex: 9999999 }}>
            <>
            {
                <span style={{color: "white", fontFamily: "terminus", height: "6vh", marginTop: "19vh", cursor: "pointer", right: "2.5vw", position: "absolute", display: buildViewerNumber !== 0 ? "none" : "block"}} onMouseLeave={() => {}} onClick={() => { }} > 
                { joinedOrg ? <> <CopyLink/> <TweetLink/> </> : <span onClick={() => {if(publicKey){setUsername(publicKey.toString().slice(0,12)); setIsReferrerModalOpen(true);}}}>{publicKey ? "Create Referral" : ""}</span>}
                </span> 
            }
            {
                  
                leaderBoardActive ?
                <img src="/leaderboardhighlight.png" alt="leaderboard" style={{width: "5vh", height: "5vh", marginTop: "4vh", cursor: "pointer", marginRight: "1rem", display: buildViewerNumber !== 0 ? "none" : "block"}} onMouseLeave={() => setLeaderboardActive(false)} onClick={() => { setbuildViewerNumber(9); }} />
                :
                <img src="/leaderboard.png" alt="leaderboard" style={{width: "5vh", height: "5vh", marginTop: "4vh", cursor: "pointer", marginRight: "1rem", display: buildViewerNumber !== 0 ? "none" : "block"}} onMouseEnter={() => setLeaderboardActive(true)} onClick={() => { setbuildViewerNumber(9); }} />
                
            }
            {buildViewerNumber != 1 ? (
                <div className="wallet-buttons" style={{ marginTop:"0vh", zIndex: 9999999}}>
                <WalletMultiButton />
                </div>
            ):(
                <div className="play" style={{display: footerVisible ? "none" : 'flex'}}>
                <Button buttonClass="playButton" title={"Play"} onClickFunction={() => {setbuildViewerNumber(0);}} args={[activeGames[0]]}/>
                </div>
            )}
            </>
            </div>
        </div>
        <>
        {buildViewerNumber==0 ? (
        <>
        <div className="game-select" style={{display: gameId == null && gameEnded == 0 ? 'flex' : 'none'}}>
            <div className="select-background">
            <img className="logo-image" src={`${process.env.PUBLIC_URL}/token.png`} width="30vw" height="auto" alt="Image"/>
            <h1 className="titleBackground"> SUPERSIZE </h1>
            </div>
            <div className="join-game">
                < div className="table">
                    <div className="playerName">
                        <input 
                            className="playerNameText"
                            type="text" 
                            value={playerName} 
                            onChange={handleNameChange} 
                            placeholder="Enter your name"
                        />
                    </div>
                    <div className="buyInField">
                    <div
                    style={{
                        display: "flex",
                        alignItems: "center", 
                        width: "100%", 
                        position: "relative", 
                    }}
                    >
                    <div
                        className="buyInInfo"
                        style={{
                        marginLeft: "5px",
                        width: "fit-content",
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 1, 
                        overflow: "hidden", 
                        whiteSpace: "nowrap", 
                        textOverflow: "ellipsis",
                        }}
                    >
                        <img
                        src={activeGames[0] ? activeGames[0].image : `${process.env.PUBLIC_URL}/token.png`}
                        width="20px"
                        height="auto"
                        alt="Image"
                        style={{
                            flexShrink: 0, 
                            marginRight: "8px",
                        }}
                        />
                        <div
                        style={{
                            display: "inline-block",
                            height: "20px",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            marginTop: "3px",
                            flexShrink: 1, 
                        }}
                        >
                        {activeGames[0] ? activeGames[0].token : "LOADING"}
                        </div>
                    </div>
                    <input
                        className="BuyInText"
                        type="number"
                        value={buyIn}
                        onChange={(e) => setBuyIn(parseFloat(e.target.value))}
                        placeholder={activeGames[0] ? activeGames[0].base_buyin.toString() : "0"}
                        step={activeGames[0] ? activeGames[0].min_buyin / 10 : 0}
                        min={activeGames[0] ? activeGames[0].min_buyin : 0}
                        max={activeGames[0] ? activeGames[0].max_buyin : 0}
                        style={{
                        flexGrow: 1, 
                        flexShrink: 0,
                        marginLeft: "10px",
                        marginRight: "0",
                        zIndex: 1,
                        position: "relative", 
                        }}
                    />
                    </div>
                    </div>
                    <div className="buyInSlider">
                    <input 
                        type="range" 
                        min={activeGames[0] ? activeGames[0].min_buyin : 0}  
                        max={activeGames[0] ? (activeGames[0].max_buyin + activeGames[0].min_buyin/10) : 0} 
                        step={activeGames[0] ? (activeGames[0].min_buyin/10) : 0} 
                        value={buyIn} 
                        onChange={handleSliderChange} 
                        className="slider" 
                    />
                    </div>
                    <div className="gameSelect">
                        <div className="gameSelectButton" style={{maxHeight: expandlist ?  "25vh" : "auto", height: expandlist ? "25vh" : "auto"}}>
                            <div style={{  display: "flex", flexDirection: "row", width:"100%", paddingBottom:"0.4em", paddingTop:"0.4em", borderBottom:"1px solid", background:"white", zIndex:"999", borderBottomLeftRadius: expandlist ? "0px" : "10px", borderBottomRightRadius: expandlist ? "0px" : "10px", borderTopLeftRadius: "10px", borderTopRightRadius:"10px", borderColor:"#5f5f5f"}}>
                            <div onClick={() => {handleClick(0);}} style={{ width: "4vw", paddingTop:"0.4em", alignItems: 'center', justifyContent: 'center', cursor: "pointer", alignSelf:"flex-start", display:"flex", fontSize: "20px", fontWeight:"700" }}>
                            {!openGameInfo[0] ? "+" : "-"}
                            </div>
                            <div className="gameInfo" style={{ display: "flex", flexDirection: "column", fontSize:"1rem", paddingTop:"0.2em", overflow:"hidden", width:"100%" }}>
                                    <span style={{ opacity: "0.7", fontSize: "0.7rem", marginBottom:"5px" }}></span>
                                    <span>{activeGames.length > 0 ? activeGames[0].name : "loading"} {/*<p style={{opacity: "0.7", fontSize:"10px", display:"inline-flex"}}>[demo]</p> */}</span>
                                    {openGameInfo[0] ? (
                                    <>
                                    <span style={{ opacity: "0.7", fontSize: "0.7rem", marginBottom:"5px" }}>players: {activeGames[0].active_players} / {activeGames[0].max_players}</span>
                                    <span style={{ opacity: "0.7", fontSize: "0.7rem", marginBottom:"5px" }}>token: {activeGames[0].token}</span>
                                    <span style={{ opacity: "0.7", fontSize: "0.7rem", marginBottom:"5px" }}>game id: {activeGames[0].worldId.toString()}</span>
                                    </>
                                    ): null}
                            </div>
                            <div style={{marginLeft: "auto", width:"2vw", paddingTop:"0.8em", alignItems:'center', alignSelf:"flex-start",justifyContent:'flex-end', marginRight:"1vw", cursor: "pointer", display:"flex"}} onClick={(e) => {setexpandlist(!expandlist); setOpenGameInfo(new Array(activeGames.length).fill(false));}}>
                            <svg width="15" height="9" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:"1vw", height:'auto', transform: expandlist ? "scaleY(-1)" : "scaleY(1)", transformOrigin: 'center'}}>
                            <path d="M5 6L9.33013 0H0.669873L5 6Z" fill="black"/>
                            </svg>
                            </div>
                            </div>
                            {expandlist ? (
                            <>
                            <div className="gameInfoContainer" style={{maxHeight: expandlist ? "20vh" : "auto", height: "20vh"}}>
                            {activeGames.map((item, index) => (
                            <>
                            <div style={{  display: "flex", flexDirection: "row", width:"100%", paddingTop: "0.4em",paddingBottom:!expandlist ?"0.4em":"0.15em", borderBottom:"1px solid", borderColor:"#5f5f5f", opacity:"0.5", cursor: "pointer"}}
                                                            onMouseEnter={(e) => {e.currentTarget.style.background = '#FFEF8A'; e.currentTarget.style.opacity = '1.0';}}
                                                            onMouseLeave={(e) => {e.currentTarget.style.background = 'white'; e.currentTarget.style.opacity = '0.5';}}>  
                            <div style={{width: "3.2vw", alignItems: 'center', justifyContent: 'center', cursor: "pointer", alignSelf:"flex-start", display: index == 0 ? 'flex' : 'flex' , marginTop:"0.7vh", fontSize: "20px", fontWeight:"700"}} onClick={() => {handleClick(index);}}>
                            {!openGameInfo[index] ? "+" : "-"}
                            </div>
                            <div className="gameInfo" style={{ display: "flex", flexDirection: "column", fontSize:"1rem", overflow:"hidden", marginBottom:"5px", marginTop:"0.15em", width:"100%" }} 
                            onClick={()=>{                                        
                                const copiedActiveGameIds: ActiveGame[] = [...activeGames];
                                const [item] = copiedActiveGameIds.splice(index, 1);
                                copiedActiveGameIds.unshift(item);
                                setActiveGames(copiedActiveGameIds);}}>
                                    <span style={{ opacity: "0.7", fontSize: "0.7rem", marginBottom:"5px" }}></span>
                                    <span> {item.name} {/* <p style={{opacity: "0.7", fontSize:"10px", display:"inline-flex"}}>[demo]</p> */}</span>
                                    {openGameInfo[index] ? (
                                    <>
                                    <span style={{ opacity: "0.7", fontSize: "0.7rem", marginBottom:"5px" }}>players: {item.active_players} / {item.max_players}</span>
                                    <span style={{ opacity: "0.7", fontSize: "0.7rem", marginBottom:"5px" }}>token: {activeGames[0].token}</span>
                                    <span style={{ opacity: "0.7", fontSize: "0.7rem", marginBottom:"5px" }}>game id: {item.worldId.toString()}</span>
                                    </>
                                    ): null}
                            </div>
                            <div style={{marginLeft: "auto", width:"2vw", height:"100%", display: index == 0 ? 'flex' : 'none', alignItems:'center', justifyContent:'flex-end', marginRight:"1vw", cursor: "pointer"}}>
                            <svg width="15" height="9" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:"1vw", height:'auto'}}>
                            <path d="M5 6L9.33013 0H0.669873L5 6Z" fill="black"/>
                            </svg>
                            </div>
                            </div>
                            </>
                            ))}
        
                            </div>
                            <div className="searchbox" style={{marginTop: "auto"}}>
                                <img src={`${process.env.PUBLIC_URL}/magnifying-glass.png`} width="20px" height="auto" alt="Image" style={{ marginLeft: "0.6vw", width: "1vw"}} onClick={handleImageClick} />
                                <input type="text" className="text-input" placeholder="Search by game id" style={{background:"none", border:"none",marginRight:"1vw", height:"80%", width:"100%"}}
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyPress}
                                >          
                                </input>
                            </div>
                            </> ) : null}
                        </div>
                    </div>
                     {/* <div className="play">
                        <Button buttonClass="createGameButton" title={"Create Game"} onClickFunction={() => setbuildViewerNumber(5)}/>
                    </div> */}
                    <div className="play">
                        <Button buttonClass="playButton" title={`Buy ${activeGames[0] ? activeGames[0].token.toString().slice(0,7) : "LOADING"}`} onClickFunction={handleBuyClick} args={[activeGames[0]]}/>
                    </div>
                    <div className="play">
                        <Button buttonClass="playButton" title={"Play"} onClickFunction={joinGameTx} args={[activeGames[0]]}/>
                    </div>
                </div>
            </div>
            
        </div>
        </>): (
            <>
            {buildViewerNumber == 1 ? (
            <div className="info-container" style={{display: gameId == null && gameEnded == 0 ? 'flex' : 'none'}}>
            <div className="info-image-container" style={{display: footerVisible ? 'none' : 'flex', opacity: footerVisible ? "0" : "1", zIndex: "-1"}}>
              <img src={`${process.env.PUBLIC_URL}/supersizemaybe.png`} alt="Spinning" className="info-spinning-image" />
            </div>
            <div className="info-text-container" style={{width: footerVisible ? '100%' : '65%', paddingLeft: footerVisible ? '0' : '20px',  paddingRight: footerVisible ? '0' : '6vw'}}>
              <div className="info-scrolling-text">
                <p>Supersize is a live multiplayer feeding frenzy game. Players must eat or be eaten to become the biggest onchain. 
                <br></br>
                <br></br>
                Bigger players move slower than smaller players, but can expend tokens to boost forward and eat them. Click to boost. 
                <br></br>
                <br></br>
                Supersize is playable with any SPL token. Players can exit the game at any time to receive their score in tokens. <br></br>(2% tax on exit)              
                <br></br>
                <br></br>
                All game logic and state changes are securely recorded on the Solana blockchain in real-time, <br></br>powered by  {' '}
                <a href="https://www.magicblock.gg/" target="_blank" rel="noopener noreferrer">
                    <img src={`${process.env.PUBLIC_URL}/magicblock_white_copy.svg`} alt="Spinning" className="info-spinning-image" style={{width:"300px", marginTop:"50px", display:"inline-block"}}/>
                </a>   
                </p>
                <div className={`info-footer ${footerVisible ? 'visible' : ''}`}>
                <div style={{position:"absolute", top:"-50vh", left:"40vw", width:"fit-content", color: "white", fontFamily:"Terminus", fontSize:"0.5em", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column"}}>
                Join a game
                <div className="play" style={{marginTop:"1vw"}}>
                        <Button buttonClass="playNowButton" title={"Play Now"} onClickFunction={() => {setbuildViewerNumber(0);}} args={[activeGames[0]]}/>
                    </div>
                </div>
                <div className="footer-left">
                <span className="footer-name"><div className="csupersize">© Supersize Inc. 2024</div></span>
                </div>
                <div className="footer-right">
                <div
                    style={{
                        width: '35px',
                        height: '40px',
                        display: 'flex',
                        cursor: "pointer",
                        alignItems : "center", 
                        justifyContent:"center",
                        paddingLeft: "3px",
                        paddingRight:"0px",
                    }}
                    onMouseEnter={() => setIsHovered([false,true,false,false,false])}
                    onMouseLeave={() => setIsHovered([false,false,false,false,false])}
                    onClick={() => setbuildViewerNumber(5)}
                    >
                    <img
                        src={`${process.env.PUBLIC_URL}/build2.png`}
                        width="30px"
                        height="auto"
                        alt="Image"
                        style={{
                            position: "absolute",
                            opacity: isHovered[1] ? 0.2 : 0.8,
                            transition: 'opacity 0.0s ease background 0.3s ease 0s, color 0.3s ease 0s',
                        }}
                    />
                    {isHovered[1] && (
                        <img
                        src={`${process.env.PUBLIC_URL}/buildhighlight2.png`}
                        width="30px"
                        height="auto"
                        alt="Highlighted Image"
                        style={{
                            position: 'absolute',
                            opacity: isHovered[1] ? 0.8 : 0.2,
                            transition: 'opacity 0.3s ease',
                        }}
                        />
                    )}
                </div>
                <div
                    style={{
                        width: '35px',
                        height: '40px',
                        display: 'flex',
                        cursor: "pointer",
                        alignItems : "center", 
                        justifyContent:"center",
                        paddingLeft: "3px",
                        paddingRight:"0px",
                    }}
                    onMouseEnter={() => setIsHovered([false,false,true,false,false])}
                    onMouseLeave={() => setIsHovered([false,false,false,false,false])}
                    onClick={openDocs}
                    >
                    <img
                        src={`${process.env.PUBLIC_URL}/GitBook.png`}
                        width="30px"
                        height="auto"
                        alt="Image"
                        style={{
                            position: "absolute",
                            opacity: isHovered[2] ? 0.2 : 0.8,
                            transition: 'opacity 0.0s ease background 0.3s ease 0s, color 0.3s ease 0s',
                        }}
                    />
                    {isHovered[2] && (
                        <img
                        src={`${process.env.PUBLIC_URL}/GitBookhighlight.png`}
                        width="30px"
                        height="auto"
                        alt="Highlighted Image"
                        style={{
                            position: 'absolute',
                            opacity: isHovered[2] ? 0.8 : 0.2,
                            transition: 'opacity 0.3s ease',
                        }}
                        />
                    )}
                </div>
                <div
                    style={{
                        width: '35px',
                        height: '40px',
                        display: 'flex',
                        cursor: "pointer",
                        alignItems : "center", 
                        justifyContent:"center",
                        paddingLeft: "0px",
                        paddingRight:"0px",
                    }}
                    onMouseEnter={() => setIsHovered([false,false,false,true,false])}
                    onMouseLeave={() => setIsHovered([false,false,false,false,false])}
                    onClick={openX}
                    >
                    <img
                        src={`${process.env.PUBLIC_URL}/x-logo.png`}
                        width="23px"
                        height="auto"
                        alt="Image"
                        style={{
                            position: "absolute",
                            opacity: isHovered[3] ? 0.2 : 0.8,
                            transition: 'opacity 0.0s ease background 0.3s ease 0s, color 0.3s ease 0s',

                        }}
                    />
                    {isHovered[3] && (
                        <img
                        src={`${process.env.PUBLIC_URL}/x-logo-highlight.png`}
                        width="23px"
                        height="auto"
                        alt="Highlighted Image"
                        style={{
                            position: 'absolute',
                            opacity: isHovered[3] ? 0.8 : 0.2,
                            transition: 'opacity 0.3s ease',
                        }}
                        />
                    )}
                </div>
                <div
                    style={{
                        width: '35px',
                        height: '40px',
                        display: 'flex',
                        alignItems : "center", 
                        justifyContent:"center",
                        paddingRight:"10px",
                        cursor: "pointer",
                    }}
                    onMouseEnter={() => setIsHovered([false,false,false,false,true])}
                    onMouseLeave={() => setIsHovered([false,false,false,false,false])}
                    onClick={openTG}
                    >
                    <img
                        src={`${process.env.PUBLIC_URL}/tg2.png`}
                        width="23px"
                        height="auto"
                        alt="Image"
                        style={{
                            position: "absolute",
                            opacity: isHovered[4] ? 0.2 : 0.8,
                            transition: 'opacity 0.0s ease background 0.3s ease 0s, color 0.3s ease 0s',
                        }}
                    />
                    {isHovered[4] && (
                        <img
                        src={`${process.env.PUBLIC_URL}/tg.png`}
                        width="23px"
                        height="auto"
                        alt="Highlighted Image"
                        style={{
                            position: 'absolute',
                            opacity: isHovered[4] ? 0.8 : 0.2,
                            transition: 'opacity 0.3s ease',
                        }}
                        />
                    )}
                </div>
                </div>
            </div>
              </div>
            </div>
          </div>
            ):(
                <>
                {
                buildViewerNumber === 9 ? (
                <div>
                     <Leaderboard setbuildViewerNumber={setbuildViewerNumber} />
                </div>
                )
                : 
                (
                <div className="game-select" style={{display: gameId == null && gameEnded == 0 ? 'flex' : 'none', height: '86vh', alignItems: 'center', justifyContent: 'center', flexDirection:'column'}}>
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
            </>
        )}
        <div className="linksFooter" style={{display: gameId == null && gameEnded == 0  && buildViewerNumber !=1 ? 'flex' : 'none', alignItems:"center",justifyContent:"center"}}>
            <div style={{height: "40px", alignItems:"center",justifyContent:"center",display: !isMobile ? 'flex' : 'none', padding:"10px", marginLeft:"2vw", color:"white", fontFamily:"terminus"}}>
                <div className="tps">TPS: {currentTPS}</div>
                <div className="solprice"><img src={`${process.env.PUBLIC_URL}/solana-logo.png`} width="20px" height="auto" alt="Image" style={{ width: "1vw", marginRight: "10px"}}/> ${Math.round(price)}</div>
                {/*<div className="playercount">Active Players: 0</div>*/}
            </div>
            <div
            style={{
                height: "40px",
                position: "absolute",
                alignItems: "center",
                justifyContent: "center",
                display: buildViewerNumber == 0 ? "flex" : 'none',
                padding: "10px",
                marginLeft: "auto",
                marginRight: "auto",
                color: "white",
                fontFamily: "terminus",
                flexDirection: "column",
                cursor:"pointer"
            }}
            onClick={() => setbuildViewerNumber(1)}
            >
            Learn More
            <img
                src={`${process.env.PUBLIC_URL}/morearrow.png`}
                width="20px"
                height="auto"
                alt="Image"
                style={{
                marginTop: "0vh",
                animation: "bounce 2s infinite",
                }}
                onClick={() => setbuildViewerNumber(1)}
            />
            </div>
            <div className="solstats" style={{display: !isMobile ? 'flex' : 'none'}}>
            <div
                    style={{
                        width: '35px',
                        height: '40px',
                        display: 'flex',
                        cursor: "pointer",
                        alignItems : "center", 
                        justifyContent:"center",
                        borderRight: "1px solid #FFFFFF4D",
                        paddingLeft: "3px",
                        paddingRight:"3px",
                    }}
                    onMouseEnter={() => setIsHovered([false,true,false,false,false])}
                    onMouseLeave={() => setIsHovered([false,false,false,false,false])}
                    onClick={() => setbuildViewerNumber(5)}
                    >
                    <img
                        src={`${process.env.PUBLIC_URL}/build2.png`}
                        width="20px"
                        height="auto"
                        alt="Image"
                        style={{
                            position: "absolute",
                            opacity: isHovered[1] ? 0.2 : 0.8,
                            transition: 'opacity 0.0s ease background 0.3s ease 0s, color 0.3s ease 0s',
                        }}
                    />
                    {isHovered[1] && (
                        <img
                        src={`${process.env.PUBLIC_URL}/buildhighlight2.png`}
                        width="20px"
                        height="auto"
                        alt="Highlighted Image"
                        style={{
                            position: 'absolute',
                            opacity: isHovered[1] ? 0.8 : 0.2,
                            transition: 'opacity 0.3s ease',
                        }}
                        />
                    )}
                </div>
                <div
                    style={{
                        width: '35px',
                        height: '40px',
                        display: 'flex',
                        cursor: "pointer",
                        alignItems : "center", 
                        justifyContent:"center",
                        borderRight: "1px solid #FFFFFF4D",
                        paddingLeft: "3px",
                        paddingRight:"3px",
                    }}
                    onMouseEnter={() => setIsHovered([false,false,true,false,false])}
                    onMouseLeave={() => setIsHovered([false,false,false,false,false])}
                    onClick={openDocs}
                    >
                    <img
                        src={`${process.env.PUBLIC_URL}/GitBook.png`}
                        width="20px"
                        height="auto"
                        alt="Image"
                        style={{
                            position: "absolute",
                            opacity: isHovered[2] ? 0.2 : 0.8,
                            transition: 'opacity 0.0s ease background 0.3s ease 0s, color 0.3s ease 0s',
                        }}
                    />
                    {isHovered[2] && (
                        <img
                        src={`${process.env.PUBLIC_URL}/GitBookhighlight.png`}
                        width="20px"
                        height="auto"
                        alt="Highlighted Image"
                        style={{
                            position: 'absolute',
                            opacity: isHovered[2] ? 0.8 : 0.2,
                            transition: 'opacity 0.3s ease',
                        }}
                        />
                    )}
                </div>
                <div
                    style={{
                        width: '35px',
                        height: '40px',
                        display: 'flex',
                        cursor: "pointer",
                        alignItems : "center", 
                        justifyContent:"center",
                        paddingLeft: "5px",
                        paddingRight:"5px",
                        borderRight: "1px solid #FFFFFF4D",
                    }}
                    onMouseEnter={() => setIsHovered([false,false,false,true,false])}
                    onMouseLeave={() => setIsHovered([false,false,false,false,false])}
                    onClick={openX}
                    >
                    <img
                        src={`${process.env.PUBLIC_URL}/x-logo.png`}
                        width="15px"
                        height="auto"
                        alt="Image"
                        style={{
                            position: "absolute",
                            opacity: isHovered[3] ? 0.2 : 0.8,
                            transition: 'opacity 0.0s ease background 0.3s ease 0s, color 0.3s ease 0s',

                        }}
                    />
                    {isHovered[3] && (
                        <img
                        src={`${process.env.PUBLIC_URL}/x-logo-highlight.png`}
                        width="15px"
                        height="auto"
                        alt="Highlighted Image"
                        style={{
                            position: 'absolute',
                            opacity: isHovered[3] ? 0.8 : 0.2,
                            transition: 'opacity 0.3s ease',
                        }}
                        />
                    )}
                </div>
                <div
                    style={{
                        width: '35px',
                        height: '40px',
                        display: 'flex',
                        alignItems : "center", 
                        justifyContent:"center",
                        borderRight: "1px solid #FFFFFF4D",
                        paddingLeft: "10px",
                        paddingRight:"10px",
                        cursor: "pointer",
                    }}
                    onMouseEnter={() => setIsHovered([false,false,false,false,true])}
                    onMouseLeave={() => setIsHovered([false,false,false,false,false])}
                    onClick={openTG}
                    >
                    <img
                        src={`${process.env.PUBLIC_URL}/tg2.png`}
                        width="23px"
                        height="auto"
                        alt="Image"
                        style={{
                            position: "absolute",
                            opacity: isHovered[4] ? 0.2 : 0.8,
                            transition: 'opacity 0.0s ease background 0.3s ease 0s, color 0.3s ease 0s',
                        }}
                    />
                    {isHovered[4] && (
                        <img
                        src={`${process.env.PUBLIC_URL}/tg.png`}
                        width="23px"
                        height="auto"
                        alt="Highlighted Image"
                        style={{
                            position: 'absolute',
                            opacity: isHovered[4] ? 0.8 : 0.2,
                            transition: 'opacity 0.3s ease',
                        }}
                        />
                    )}
                </div>
                <div className="csupersize">© Supersize Inc. 2024</div>
            </div>
        </div>
        
        </>
        <div className="gameWrapper">
        <div id="status" style={{display: gameId !== null ? 'block' : 'none', zIndex: 9999}}><span className="title">Leaderboard</span></div>
        <div style={{ display: gameId !== null ? 'flex' : 'none', alignItems: 'center', position: 'fixed', top: 0, left: 0, margin: '10px', zIndex: 9999}}
              onMouseEnter={() => {setExitHovered(true)}}
              onMouseLeave={() => {setExitHovered(false)}}>
            <Button buttonClass="exitButton" title={"X"} onClickFunction={handleExitClick} args={[]}/> 
            {playerExiting && countdown.current > 0 && (
                <div style={{ display: 'block', color: '#f07171', fontFamily: 'Terminus', fontSize: '20px', textAlign: 'right', marginLeft: '10px' }}>
                Disconnecting in {countdown.current} seconds
                </div>
            )}
        </div>
        <div style={{ 
            display: gameId !== null ? 'flex' : 'none', 
            alignItems: 'left', 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            margin: '10px', 
            zIndex: 9999, 
            color: "white", 
            transform: "none", 
            fontSize: "1em", 
            fontFamily: "terminus", 
            flexDirection: 'column' // Add this to stack vertically
        }}>
            <div>
                <span style={{ opacity: 0.5 }}>Your size: </span>
                <span style={{ opacity: 1 }}>{currentPlayer ? currentPlayer.score : null}</span>
            </div>
        </div>

        <div className="game" style={{display: gameId !== null ? 'block' : 'none', height: screenSize.height*scale, width: screenSize.width*scale}}>
                <GameComponent
                gameId={gameId}
                players={players}
                visibleFood={visibleFood.flat()}
                currentPlayer={currentPlayer}
                screenSize={screenSize}
                scale={scale}
            />
        </div>

        <div className="gameEnded" style={{ display: gameId == null ? 'block' : 'none', height: "100%", width: "100%" }}>
            {gameEnded === 1 && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgb(0, 0, 0)',
                        zIndex: 9999,
                    }}
                >
                    <div className="exitBox" style={{ background: 'black', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <p className="superExitInfo">You got eaten!</p>
                        {/*
                        <div style={{display:"flex", alignItems:"center", justifyContent:"center"}}>
                        <a 
                            className="superExitInfo"
                            href={`https://explorer.solana.com/tx/${reclaimTx}?cluster=mainnet`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                        >
                            Reclaim SOL 
                        </a>
                        {reclaimTx != null ? (
                        <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" style={{display:"inline", marginLeft:"5px", marginTop:"2px" }}>
                            <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
                            <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                        </svg>     
                        ) : (            
                        <svg width="52" height="52" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" stroke="#fff" style={{ display:"inline", marginLeft:"5px", marginTop:"2px", height:"20px", width:"20px"}}>
                            <g fill="none" fillRule="evenodd">
                                <g transform="translate(1 1)" strokeWidth="2">
                                    <circle strokeOpacity=".5" cx="18" cy="18" r="18" />
                                    <path d="M36 18c0-9.94-8.06-18-18-18">
                                        <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite" />
                                    </path>
                                </g>
                            </g>
                        </svg>
                        )}
                        </div> */}
                        <button id="returnButton" onClick={() => window.location.reload()}>Return home</button>
                    </div>
                </div>
            )}
            {(gameEnded === 2 || gameEnded === 3) && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgb(0, 0, 0)',
                        zIndex: 9999,
                    }}
                >
                    <div className="exitBox" style={{ background: 'black', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', userSelect: 'text' }}>
                        <p className="superExitInfo">Final score: {playerCashout.current + playerTax}</p>
                        <p className="superExitInfo">Exit tax: {playerTax + playerCashout.current * 0.02}</p>
                        <p className="superExitInfo">Payout: {playerCashout.current * 0.98}</p>
                        <div style={{display:"flex", alignItems:"center", justifyContent:"center"}}>
                        <a 
                            className="superExitInfo"
                            href={`https://explorer.solana.com/tx/${cashoutTx}?cluster=mainnet`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                        >
                            Cashout transaction
                        </a>
                        {cashoutTx != null ? (
                        <>
                            {cashoutTx != 'error' ? (  
                            <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" style={{display:"inline", marginLeft:"5px", marginTop:"2px" }}>
                                <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
                                <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                            </svg>    
                            )
                            : (<Button buttonClass="retryButton" title={"Retry"} onClickFunction={cleanUp}/> )}
                        </> 
                        ) : (          
                        <svg width="52" height="52" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" stroke="#fff" style={{ display:"inline", marginLeft:"5px", marginTop:"2px", height:"20px", width:"20px"}}>
                            <g fill="none" fillRule="evenodd">
                                <g transform="translate(1 1)" strokeWidth="2">
                                    <circle strokeOpacity=".5" cx="18" cy="18" r="18" />
                                    <path d="M36 18c0-9.94-8.06-18-18-18">
                                        <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite" />
                                    </path>
                                </g>
                            </g>
                        </svg>
                        )}
                        </div>
                        {/*
                        <div style={{display:"flex", alignItems:"center", justifyContent:"center"}}>
                        <a 
                            className="superExitInfo"
                            href={`https://explorer.solana.com/tx/${reclaimTx}?cluster=mainnet`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                        >
                            Reclaim SOL 
                        </a>
                        {reclaimTx != null ? (
                        <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" style={{display:"inline", marginLeft:"5px", marginTop:"2px" }}>
                            <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
                            <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                        </svg>     
                        ) : (            
                        <svg width="52" height="52" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" stroke="#fff" style={{ display:"inline", marginLeft:"5px", marginTop:"2px", height:"20px", width:"20px"}}>
                            <g fill="none" fillRule="evenodd">
                                <g transform="translate(1 1)" strokeWidth="2">
                                    <circle strokeOpacity=".5" cx="18" cy="18" r="18" />
                                    <path d="M36 18c0-9.94-8.06-18-18-18">
                                        <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite" />
                                    </path>
                                </g>
                            </g>
                        </svg>
                        )}
                        </div> */}
                        {cashoutTx !== null && cashoutTx !== 'error' && (<button id="returnButton" onClick={() => {window.location.reload();}}>Return home</button>)}
                    </div>
                </div>
            )}
            {gameEnded === 4 && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgb(0, 0, 0)',
                        zIndex: 9999,
                    }}
                >
                    <div className="exitBox" style={{ background: 'black', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', userSelect: 'text' }}>
                        <p className="superStartInfo" style={{ color: 'red' }}>Error encountered during payout</p>
                        <p className="superStartInfo" style={{ padding: '10px' }}>
                            <>If no transaction is received after a few minutes, contact @cheapnumbers on X</>
                            <br /><br />
                            Txn Receipt: {exitTxn}
                        </p>
                        <button id="returnButton" onClick={() => {window.location.reload();}}>Return home</button>
                    </div>
                </div>
            )}
        </div>

        </div>
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

        {transactionError && <Alert type="error" message={transactionError} onClose={() => setTransactionError(null) } />}

        {(transactionSuccess && !isJoining) && <Alert type="success" message={transactionSuccess} onClose={() => setTransactionSuccess(null) } />}
       
        {isReferrerModalOpen && buildViewerNumber==0 && (
            <div className="referrer-modal">
                <div className="referrer-modal-content">
                    <h1 className="referrer-modal-title">Sign up for referral <br/> Get $1 free play</h1>
                    <div  style={{marginBottom: "10px"}}>
                        <span style={{fontFamily: "terminus", marginLeft: "10px", marginBottom: "10px"}}>Username:</span>
                        <input type="text" className="referrer-input" placeholder="Username" value={username} onChange={(e) => {setUsername(e.currentTarget.value);  setInputUsername(e.currentTarget.value);}}/>
                    </div>
                    <div>
                        <span style={{fontFamily: "terminus", marginLeft: "10px", marginBottom: "10px"}}>Referrer:</span>
                        <span style={{fontFamily: "terminus"}}> {referrer ? referrer : "none, better get one!"} </span>
                    </div>
                    <div style={{display: "flex", justifyContent: "space-between", margin: "20px 20px"}}>
                        <button className="referrer-modal-btn" onClick={() => {setUsername(""); setIsReferrerModalOpen(false)}}>Cancel</button>
                        <button className="referrer-modal-btn" onClick={() => {}}><Invite/></button>
                    </div>
                </div>
            </div>
        )}
        </div>

        <InitBuddyLinkWrapper />
        </>
    );
};

export default App;