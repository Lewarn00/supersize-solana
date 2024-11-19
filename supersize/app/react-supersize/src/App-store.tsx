import React, {useCallback, useEffect, useRef, useState} from "react";
import {AnimatePresence, motion} from "framer-motion";
import Button from "./components/Button";
import CreateGame from "./components/CreateGame";
import GameComponent from "./components/GameComponent";
import CreateGameComponent from "./components/CreateGameComponent";
import Alert from "./components/Alert";

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
    PublicKey} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import {Idl, Program, Provider, Wallet, AnchorProvider} from "@coral-xyz/anchor";
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
  };

const App: React.FC = () => {
    const  connection =  new Connection("https://devnet.helius-rpc.com/?api-key=cba33294-aa96-414c-9a26-03d5563aa676"); //"https://devnet.helius-rpc.com/?api-key=cba33294-aa96-414c-9a26-03d5563aa676"); 
    const { publicKey, sendTransaction } = useWallet(); 
    let userKey = publicKey;
    const [savedPublicKey, setSavedPublicKey] = useState<PublicKey | null>(null);
    const [exitTxn, setExitTxn] = useState<string>('');
    const endpoints = [
        "https://supersize-fra.magicblock.app",
        "https://supersize.magicblock.app",
        "https://supersize-sin.magicblock.app",
    ];
      
    const [fastestEndpoint, setFastestEndpoint] = useState<string | null>(null);
    const [enpointDone, setEndpointDone] = useState<boolean>(false);
    const [wallet] = useState<Keypair>(() => Keypair.generate());
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
    const endpointToWorldMap: Record<string, { worldId: anchor.BN; worldPda: PublicKey }> = {
        "https://supersize-sin.magicblock.app": {
          worldId: new anchor.BN(1355),
          worldPda: new PublicKey('HfKR5HQupLdpnM7EREJPBK3nh13fRpe8ji61ParfTaVv'),
        },
        "https://supersize.magicblock.app": {
          worldId: new anchor.BN(1339),
          worldPda: new PublicKey('2tNAqh9kTgdVYS9eVFacVbAXgiwSL43k7bkJgCByoxky'),
        },
        "https://supersize-fra.magicblock.app": {
          worldId: new anchor.BN(1357),
          worldPda: new PublicKey('6kofJDbfA4DCaX6D7ev2gKa67Ko9C8CioWbp8wdYzyy6'),
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
    let mapComponentSubscriptionId= useRef<number | null>(null);

    const playersComponentClient = useRef<Program | null>(null);
    const mapComponentClient = useRef<Program | null>(null);
    const foodComponentClient = useRef<Program | null>(null); 

    const [isMouseDown, setIsMouseDown] = useState(false);
    const [mousePosition, setMousePosition] = useState({x: 0,y: 0});
    
    const [panelContent, setPanelContent] = useState<JSX.Element | null>(null);
    const [buildViewerNumber, setbuildViewerNumber] = useState(0);
    const [isHovered, setIsHovered] = useState([false,false,false,false,false,false]);

   const [gameEnded, setGameEnded] = useState(0);
   const [playerCashout, setPlayerCashout] = useState(0);
   const [playerTax, setPlayerTax] = useState(0);
   const playerRemovalTimeRef = useRef<BN | null>(null);
   const [cashoutTx, setCashoutTx] = useState<string| null>(null);
   const [reclaimTx, setReclaimTx] = useState<string| null>(null);
   const [cashingOut, setCashingOut] = useState<boolean>(false);
   const [playerCashoutAddy, setPlayerCashoutAddy] = useState<PublicKey| null>(null);
   const nextFood = useRef({x: -1,y: -1});

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

   const provider = new anchor.AnchorProvider(
    connection,
    new NodeWallet(wallet),
    {
        preflightCommitment: 'processed',
        commitment: 'processed',
    }
    );

    const providerEphemeralRollup = useRef<anchor.AnchorProvider>(new anchor.AnchorProvider(
        new anchor.web3.Connection("https://supersize.magicblock.app", {
        wsEndpoint: "wss://supersize.magicblock.app",
        }),
        new NodeWallet(wallet) 
    ));

    anchor.setProvider(provider);

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
    if (publicKey) {
        setSavedPublicKey(publicKey); 
    }
    }, [publicKey]);

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
        const wsUrl = fastestEndpoint.replace("https", "wss");
        providerEphemeralRollup.current = new anchor.AnchorProvider(
            new anchor.web3.Connection(fastestEndpoint, {
            wsEndpoint: wsUrl,
            }),
            new NodeWallet(wallet)
        );
    
        console.log('Updated providerEphemeralRollup:', providerEphemeralRollup.current);
        const { worldId, worldPda } = endpointToWorldMap[fastestEndpoint];
        setActiveGames([{ worldId: worldId, worldPda: worldPda} as ActiveGame]);
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
        setPlayerCashout(player.score);
        setPlayerTax(player.tax);
        setPlayerCashoutAddy(player.payoutTokenAccount)
    }, [setCurrentPlayer, playerKey, allFood]);

    const updateMyPlayer = useCallback((player: any) => {
        if(player.scheduledRemovalTime){
            playerRemovalTimeRef.current = player.scheduledRemovalTime;
        }
        if(Math.sqrt(player.mass) == 0 &&
        player.x === 50000 &&
        player.y === 50000 &&
        player.score == 0.0 &&
        !cashingOut){
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
        console.log(map); 
        if(map.nextFood){
            if(map.nextFood.x !== nextFood.current.x || map.nextFood.y !== nextFood.current.y){
            //console.log('new food', map.nextFood, nextFood.current);
            nextFood.current = {x: map.nextFood.x, y: map.nextFood.y};
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
            transaction.sign(walletRef.current);

            const signature = await provider.connection.sendRawTransaction(transaction.serialize(), {
              skipPreflight: skipPre,
              preflightCommitment: commitmetLevel,
            });
            await provider.connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature }, commitmetLevel);

            setTransactionSuccess(`Transaction confirmed`);
            return signature; 
        } catch (error) {
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
                        console.error(`Error with signature ${signature}`, result.err);
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
        maxRetries = 5,
        delay = 1000 
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

    /**
     * Create a new join game transaction
     */
    const joinGameTx = useCallback(async (selectGameId: ActiveGame) => {
        if (!playerKey) throw new WalletNotConnectedError();
        if (!publicKey) throw new WalletNotConnectedError();
        if (isSubmitting) return null;
        setIsJoining(true);
        setScreenSize({width:selectGameId.size, height:selectGameId.size});
        const gameInfo = selectGameId; 
        let maxplayer=20;
        let foodcomponents = 32;
        setMapSize(selectGameId.size);
        if(selectGameId.size==4000){
            maxplayer=20;
            foodcomponents = 32;
        }
        else if(selectGameId.size==6000){
            maxplayer=40;
            foodcomponents = 64;
        }
        else if(selectGameId.size==10000){
            maxplayer=100;
            foodcomponents = 200;
        }

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

        if(anteacc){
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
                lamports: 0.007 * LAMPORTS_PER_SOL, 
            });
            const combinedTx = new Transaction().add(soltransfertx)
            .add(createTokenAccountTx).add(transferIx); 
            const createwalletsig = await submitTransactionUser(combinedTx);
        }

        entityMatch.current = mapEntityPda;
        const foodEntityPdas: any[] = [];
        let targetfoodid = 0;
        let lowestfood = 100;
        const foodComponentClient= await getComponentsClient(FOOD_COMPONENT);
        for (let i = 1; i < foodcomponents+1; i++) {
            const foodseed = 'food' + i.toString(); 
            const foodEntityPda =  FindEntityPda({
                worldId: gameInfo.worldId,
                entityId: new anchor.BN(0),
                seed: foodseed
            })
            foodEntityPdas.push(foodEntityPda)

            const foodComponentPda = FindComponentPda({
                componentId: FOOD_COMPONENT,
                entity: foodEntityPda,
            });
            const foodacc = await providerEphemeralRollup.current.connection.getAccountInfo(
                foodComponentPda, "processed"
            );
            if(foodacc){
                
                const foodParsedData = foodComponentClient.coder.accounts.decode("section", foodacc.data);
                if (foodParsedData.food.length < lowestfood){
                    lowestfood= foodParsedData.food.length;
                    targetfoodid = i-1;
                }
            }
        }

        const playerEntityPdas: any[] = [];
        const playerClientER = await getComponentsClient(PLAYER_COMPONENT);
        const playerClient = await getComponentsClientBasic(PLAYER_COMPONENT);
        let newplayerEntityPda : any = null;
        let myPlayerId = '';
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
            myPlayerId = playerentityseed;
            if(playersacc){
                const playersParsedData = playerClient.coder.accounts.decode("player", playersacc.data);
                if(playersParsedData.authority == null && newplayerEntityPda == null){
                    newplayerEntityPda = playerEntityPda;
                    break;
                }
            }
            else{
                newplayerEntityPda = playerEntityPda;
                break;
            }
            }
                console.log('myPlayer', myPlayerId)
                console.log('vault', vault_token_account.toString(), 'sender', sender_token_account.toString());
                const applyBuyInSystem = await ApplySystem({
                    authority: playerKey,
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
                const buyintx = new anchor.web3.Transaction().add(applyBuyInSystem.transaction);
                //const buyinsignature = await submitTransaction(buyintx, "confirmed", true);
                const buyinsignature = await retrySubmitTransaction(buyintx, connection, "confirmed");
                //if buy in fails, reclaim sol + coins, if succeeds everything else will work
                if(buyinsignature == null){
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
                        lamports: playerbalance - 5000,
                    });
                    reclaim_transaction.add(transfertokens);
                    reclaim_transaction.add(closeInstruction);
                    reclaim_transaction.add(solTransferInstruction);
                    const reclaimsig = await submitTransaction(reclaim_transaction, "confirmed", true);
                    console.log(
                        `buy in failed, reclaimed tokens: ${reclaimsig}`
                    );
                    throw new Error('Buy in failed, reclaimed SOL');
                }
                else{
                    console.log(
                        `buy in signature: ${buyinsignature}`
                    );
                }
                
                const playerdeltx = new anchor.web3.Transaction();
                const playerComponentPda = FindComponentPda({
                    componentId: PLAYER_COMPONENT,
                    entity: newplayerEntityPda,
                });
                const playerdelegateIx = createDelegateInstruction({
                entity: newplayerEntityPda,
                account: playerComponentPda,
                ownerProgram: PLAYER_COMPONENT,
                payer: playerKey,
                });
                playerdeltx.add(playerdelegateIx)
                const playerdelsignature = await submitTransaction(playerdeltx, "confirmed", true); //provider.sendAndConfirm(playertx, [], { skipPreflight: true, commitment: 'finalized' }); 
                console.log(
                    `Delegation signature: ${playerdelsignature}`
                );

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

            if (!walletRef.current) {
                throw new Error('Wallet is not initialized');
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
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (signature != null) {
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
        if (gameId == null) setTransactionError("Not connected to game");
        if(currentWorldId.current==null){
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
        console.log('staged exit')
        const signature = await providerEphemeralRollup.current.connection.sendRawTransaction(
            transaction.serialize(), 
            { skipPreflight: true } 
        );
    }, [playerKey, submitTransaction, subscribeToGame]);

    const exitGameTx = useCallback(async () => {
        if (!playerKey) throw new WalletNotConnectedError();
        if (gameId == null) setTransactionError("Not connected to game");
        if(currentWorldId.current==null){
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
                    ((cashingOut && gameEnded==2) ||
                    !cashingOut)
                ) {
                    if(currentWorldId.current==null){
                        throw new Error("world not found");
                    }
                    //console.log(currentPlayer)
                    if(currentPlayerEntity.current && anteroomEntity.current && entityMatch.current){
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
                        const playerdelsignature = await providerEphemeralRollup.current.sendAndConfirm(tx, [], { skipPreflight: false });
                        await waitSignatureConfirmation(
                            playerdelsignature,
                            providerEphemeralRollup.current.connection,
                            "finalized"
                          );
                        console.log('undelegate', playerdelsignature)
                        
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
                            if (playerCashoutAddy){
                                sender_token_account = playerCashoutAddy;
                            }
                            //console.log('cashout data', sender_token_account.toString(), playerCashoutAddy?.toString());
                           if(cashingOut && gameEnded==2){
                            const applyCashOutSystem = await ApplySystem({
                                authority: playerKey,
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
                            const cashouttx = new anchor.web3.Transaction().add(applyCashOutSystem.transaction);
                            //const cashoutsignature = await submitTransaction(cashouttx, "confirmed", true);
                            const cashoutsignature = await retrySubmitTransaction(cashouttx, connection, "confirmed");
                            console.log('cashout', cashoutsignature);
                            if (cashoutsignature){
                                setCashoutTx(cashoutsignature);
                            }
                            }
                            const reclaim_transaction = new Transaction();
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
                                lamports: playerbalance - 5000,
                            });
                            reclaim_transaction.add(transfertokens);
                            reclaim_transaction.add(closeInstruction);
                            reclaim_transaction.add(solTransferInstruction);
                            const reclaimsig = await submitTransaction(reclaim_transaction, "confirmed", true);
                            console.log("get winnings", reclaimsig, accountInfo.amount, playerbalance);

                            if(reclaimsig){
                                setReclaimTx(reclaimsig);
                            }else{
                                setGameEnded(4);
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
        if(currentPlayer){
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
                let currentSection = getSectionIndex(currentPlayer.x, currentPlayer.y, mapSize, false);
                let currentSectionBoosting = getSectionIndex(currentPlayer.x, currentPlayer.y, mapSize, true);
                //let foodtoeat = checkFoodDistances(visibleFood[currentSection], screenSize);
                //let playerfoodtoeat = checkFoodDistances(visibleFood[currentSectionBoosting], screenSize);
                if(true){
                    const eatFoodTx = await ApplySystem({
                        authority: playerKey,
                        world: currentWorldId.current,
                        entities: [
                                {
                                entity: currentPlayerEntity.current,
                                components: [{ componentId: PLAYER_COMPONENT }],
                                }, 
                                {
                                entity: foodEntities.current[currentSection],
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
                if(true){
                    const eatPlayerFoodTx = await ApplySystem({
                        authority: playerKey,
                        world: currentWorldId.current,
                        entities: [
                                {
                                entity: currentPlayerEntity.current,
                                components: [{ componentId: PLAYER_COMPONENT }],
                                }, 
                                {
                                entity: foodEntities.current[currentSectionBoosting],
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
                    alltransaction.add(eatPlayerFoodTx.transaction);  
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

                const makeMove = await ApplySystem({
                    authority: playerKey,
                    world: currentWorldId.current,
                    entities: [
                      {
                        entity: currentPlayerEntity.current,
                        components: [{ componentId: PLAYER_COMPONENT }],
                      },
                      {
                        entity: foodEntities.current[currentSectionBoosting],
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
                //console.log(allFood, visibleFood); 
                setIsSubmitting(false);
                setTransactionError(null);
                setTransactionSuccess(null);
                /*if (gameId && entityMatch.current) {   
                    setIsSubmitting(false);
                    setTransactionError(null);
                    setTransactionSuccess(null);
                                        
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
                          //console.error("Failed to fetch account:", error);
                          //food account unpopulated
                        });
                    }
                    
                    const mapComponent = FindComponentPda({
                        componentId: MAP_COMPONENT,
                        entity: entityMatch.current,
                    });
                    (mapComponentClient.current?.account as any).map.fetch(mapComponent, "processed").then(updateMap).catch((error: any) => {
                        console.error("Failed to fetch account:", error);
                     });

                    for (let i = 0; i < playerEntities.current.length; i++) {
                        const playersComponenti = FindComponentPda({
                            componentId: PLAYER_COMPONENT,
                            entity: playerEntities.current[i],
                        });
                        (playersComponentClient.current?.account as any).player.fetch(playersComponenti, "processed").then((fetchedData: any) => updatePlayers(fetchedData, i)).catch((error: any) => {
                            //console.error("Failed to fetch account:", error);
                         });
                    } 
                }*/
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
    }, [gameId, currentPlayer, exitHovered]);

    useEffect(() => {
        //const firstHalf = foodListLen.slice(0, Math.floor(foodListLen.length / 2));
        //const hasValueLessThan100 = firstHalf.some(value => value < 100);

        const intervalId = setInterval(() => {
            processNewFoodTransaction(nextFood.current.x, nextFood.current.y);
        }, 400); 
        
        return () => clearInterval(intervalId);
    }, [gameId, nextFood]);

    const checkPlayerDistances = (visiblePlayers: Blob[], screenSize: { width: number, height: number }) => {
        if(currentPlayer?.radius){
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
        if(currentPlayer?.radius){
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
    
    function getSectionIndex(x: number, y: number, mapSize: number, duplicateEncoding: boolean = false): number {
        const sectionSize = 1000; // each section is 1000x1000
        const sectionsPerRow = mapSize / sectionSize;
        const mapSectionCount = sectionsPerRow * sectionsPerRow;
        const adjustedX = Math.min(x, mapSize - 1);
        const adjustedY = Math.min(y, mapSize - 1);
        //const row = Math.floor(adjustedX / sectionSize);
        //const col = Math.floor(adjustedY / sectionSize);
        const row = Math.floor(adjustedY / sectionSize); 
        const col = Math.floor(adjustedX / sectionSize); 
        let baseIndex = row * sectionsPerRow + col;
        if (duplicateEncoding) {
            baseIndex += mapSectionCount;
        }
    
        return baseIndex;
    }

    const processNewFoodTransaction = async (foodX : number, foodY : number) => {
        if(currentWorldId.current !== null){
        const allTransaction = new anchor.web3.Transaction();
        if(currentPlayerEntity.current && entityMatch.current){
        try {
            /*let current_foodlist = foodListLen.reduce((minIndex, currentValue, currentIndex, array) =>
                currentValue < array[minIndex] ? currentIndex : minIndex
            , 0);*/
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
            let currentSection = getSectionIndex(foodX, foodY, mapSize, false);
            const newFoodTx = await ApplySystem({
                authority: foodKey,
                world: currentWorldId.current,
                entities: [
                    {
                        entity: entityMatch.current,
                        components: [{ componentId: MAP_COMPONENT }],
                    },
                    {
                        entity: foodEntities.current[currentSection],
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
                console.log(error); 
            });
            if (signature){
                await waitSignatureConfirmation(
                    signature,
                    providerEphemeralRollup.current.connection,
                    "finalized"
                  );
                //console.log('new food', signature)
            }
        } catch (error) {
            console.log("Transaction failed", error);
        }
        }
        }
    };

    const handleExitClick = () => {
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
        if(entityMatch || gameId){ 
            const handleMouseMove = (event: MouseEvent) => {
                setMousePosition({x:event.clientX, y: event.clientY}); 
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
        const  mainnet_connection =  new Connection("https://mainnet.helius-rpc.com/?api-key=cba33294-aa96-414c-9a26-03d5563aa676"); //"https://devnet.helius-rpc.com/?api-key=cba33294-aa96-414c-9a26-03d5563aa676"); 
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
                    const worldId = {worldId: new anchor.BN(inputValue.trim())};
                    const worldPda = await FindWorldPda( worldId);
                    const newGameInfo : ActiveGame = {worldId: worldId.worldId, worldPda: worldPda, name: "loading", active_players: 0, max_players: 0, size: 0}
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
        useEffect(() => {
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
                                        ? { ...game, name: mapParsedData.name, active_players: activeplayers, max_players: mapParsedData.maxPlayers, size: mapParsedData.width  } 

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

            fetchAndLogMapData();
        
        }, [openGameInfo, enpointDone]);

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
        <div className="topbar" style={{display: gameId == null && gameEnded == 0 ? 'flex' : 'none',background: buildViewerNumber==1 ? "rgba(0, 0, 0, 0.3)" : "rgb(0, 0, 0)",height: isMobile && buildViewerNumber == 1 ? '20vh' : buildViewerNumber == 1 ? '10vh' : '4vh', zIndex: 9999999}}>
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
                        ) : (        
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
                        <div className="buyInInfo" style={{marginLeft:"5px", width: "30%", display: "flex", alignItems: "center" }}>
                        <img src={`${process.env.PUBLIC_URL}/agld.jpg`} width="20px" height="auto" alt="Image" style={{alignItems:"center", justifyContent: "center"}}/>
                        <div style={{height:"20px", display: 'inline', marginLeft:"8px", marginTop:"3px"}}>AGLD</div>
                        </div>
                        <input 
                            className="BuyInText"
                            type="number" 
                            value={buyIn}
                            onChange={(e) => setBuyIn(parseFloat(e.target.value))} 
                            placeholder="0.1"
                            step="0.01"
                            min="0.1"
                        />
                    </div>
                    <div className="buyInSlider">
                    <input 
                        type="range" 
                        min="0.1" 
                        max="10.01" 
                        step="0.1" 
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
                                    <span style={{ opacity: "0.7", fontSize: "0.7rem", marginBottom:"5px" }}>game size: {activeGames[0].size}</span>
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
                                    <span style={{ opacity: "0.7", fontSize: "0.7rem", marginBottom:"5px" }}>game size: {item.size}</span>
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
                    <div className="play">
                        <Button buttonClass="playButton" title={"Play"} onClickFunction={joinGameTx} args={[activeGames[0]]}/>
                    </div>
                    <div className="play">
                        <Button buttonClass="createGameButton" title={"Create Game"} onClickFunction={() => setbuildViewerNumber(5)}/>
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
                Supersize is playable with any SPL token. Players can exit the game at any time to receive their score in tokens. <br></br>(3% tax on exit)              
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
                <div className="game-select" style={{display: gameId == null && gameEnded == 0 ? 'flex' : 'none', height: '86vh', alignItems: 'center', justifyContent: 'center', flexDirection:'column'}}>
                <CreateGameComponent 
                connection={connection}
                playerKey={playerKey}
                walletRef={walletRef}
                provider={provider}
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
            {playerExiting && countdown > 0 && (
                <div style={{ display: 'block', color: '#f07171', fontFamily: 'Terminus', fontSize: '20px', textAlign: 'right', marginLeft: '10px' }}>
                Disconnecting in {countdown} seconds
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
                        <div style={{display:"flex", alignItems:"center", justifyContent:"center"}}>
                        <a 
                            className="superExitInfo"
                            href={`https://explorer.solana.com/tx/${reclaimTx}?cluster=devnet`} 
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
                        </div>
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
                        <p className="superExitInfo">Final score: {playerCashout + playerTax}</p>
                        <p className="superExitInfo">Exit tax: {playerTax + playerCashout * 0.02}</p>
                        <p className="superExitInfo">Payout: {playerCashout * 0.98}</p>
                        <div style={{display:"flex", alignItems:"center", justifyContent:"center"}}>
                        <a 
                            className="superExitInfo"
                            href={`https://explorer.solana.com/tx/${cashoutTx}?cluster=devnet`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                        >
                            Cashout transaction
                        </a>
                        {cashoutTx != null? (
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
                        </div>
                        <div style={{display:"flex", alignItems:"center", justifyContent:"center"}}>
                        <a 
                            className="superExitInfo"
                            href={`https://explorer.solana.com/tx/${reclaimTx}?cluster=devnet`} 
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
                        </div>
                        <button id="returnButton" onClick={() => {window.location.reload(); setPlayerCashout(0);}}>Return home</button>
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
                        <button id="returnButton" onClick={() => {setPlayerCashout(0); window.location.reload();}}>Return home</button>
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
        </div>
        </>
    );
};

export default App;