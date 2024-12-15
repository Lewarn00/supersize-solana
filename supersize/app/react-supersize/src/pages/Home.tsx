// import { withMainLayout } from "@layouts/MainLayout"
import { withMainLayout } from "@layouts/MainLayout";
import { useCallback, useEffect, useState, useRef } from "react";
import { ActiveGame } from "@utils/types";
import { Link } from "react-router-dom";
import Alert from "@components/Alert";
import { useSupersizeContext } from "@contexts/SupersizeContext";
import { FindWorldPda } from "@magicblock-labs/bolt-sdk";
import * as anchor from "@coral-xyz/anchor";
import { useNavigate } from "react-router-dom";

const Home = () => {
    const {
        buyIn,
        setBuyIn,
        playerName,
        activeGames,
        setActiveGames,
        openGameInfo,
        setOpenGameInfo,
        inputValue,
        joinGameTx,
        isJoining,
        isSubmitting,
        transactionError,
        transactionSuccess,
        setTransactionError,
        setTransactionSuccess,
        setPlayerName,
        setInputValue,
        setNewGameCreated
    } = useSupersizeContext();
    const [expandlist, setExpandlist] = useState(false);
    const swapAmount = useRef("");
    const navigate = useNavigate();
    
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

    const handleClick = (index: number) => {
        setOpenGameInfo((prevState) => {
            const newState = [...prevState];
            newState[index] = !newState[index];
            return newState;
        });
    };

    const handleImageClick = async () => {
        if (inputValue.trim() !== "") {
            try {
                const worldId = { worldId: new anchor.BN(inputValue.trim()) };
                const worldPda = await FindWorldPda(worldId);
                const newGameInfo: ActiveGame = {
                    worldId: worldId.worldId,
                    worldPda: worldPda,
                    name: "loading",
                    active_players: 0,
                    max_players: 0,
                    size: 0,
                    image: "",
                    token: "",
                    base_buyin: 0,
                    min_buyin: 0,
                    max_buyin: 0,
                };
                console.log(
                    "new game info",
                    newGameInfo.worldId,
                    newGameInfo.worldPda.toString(),
                );
                setNewGameCreated(newGameInfo);
                setActiveGames([newGameInfo, ...activeGames]);
                setOpenGameInfo(new Array(activeGames.length).fill(false));
            } catch (error) {
                console.error("Invalid PublicKey:", error);
            }
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            handleImageClick();
        }
    };

    useEffect(() => {
        if(activeGames[0]){
            if(activeGames[0].token == "AGLD"){
                swapAmount.current = "https://raydium.io/swap/?inputMint=sol&outputMint=7dnMwS2yE6NE1PX81B9Xpm7zUhFXmQABqUiHHzWXiEBn";
            }else{
                swapAmount.current = `https://jup.ag/swap/SOL-EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`; //${tokenMint}`
            }
        }
    }, [activeGames]);

    const handleBuyClick = () => {
        window.open(swapAmount.current, "_blank", "noopener,noreferrer");
    };
    

    return (
        <div className="flex h-[84vh]">
            <div className="flex items-center justify-center w-screen h-[84vh] absolute font-[Conthrax]">
                <img
                    className="relative w-[30vw] h-auto top-[-6vw] left-[-11vw] opacity-30 z-[-1] transform-none"
                    src={`${process.env.PUBLIC_URL}/token.png`}
                    alt="Image"
                />
                <h1 className="text-[#eee] font-[Conthrax] text-[5vw] -ml-[28vw] -mt-[11vw]">
                    {" "}
                    SUPERSIZE{" "}
                </h1>
            </div>
            <div className="z-[2] flex justify-center items-center w-full h-full">
                <div className="backdrop-brightness-[0.95] grid grid-rows-auto grid-cols-4 gap-1 w-[30vw] fixed mt-[1vw]">
                    <div className="bg-white col-start-1 col-span-4 flex m-4 h-[2.5em] items-center rounded-[10px] border border-[#DCDCDC] text-left mt-[5em] text-[1rem] font-[Terminus] overflow-hidden">
                        <input
                            type="text"
                            className="outline-none flex items-center justify-center text-left text-[1rem] px-5 text-black border-none bg-transparent font-[Terminus] overflow-hidden select-none"
                            value={playerName}
                            onChange={handleNameChange}
                            placeholder="Enter your name"
                        />
                    </div>

                    <div className="bg-white text-black col-start-1 col-span-2 flex items-center justify-between h-[2.5em] rounded-[10px] ml-[1em] mb-[1em] w-[95%] border border-[#DCDCDC] text-left text-[1rem] font-[Terminus] overflow-hidden">
                        <div className="ml-[5px] w-[30%] flex items-center">
                            <img
                                src={
                                    activeGames[0]
                                        ? activeGames[0].image
                                        : `${process.env.PUBLIC_URL}/token.png`
                                }
                                alt="Image"
                                className="w-[20px] h-auto"
                            />
                            <div className="h-[20px] inline ml-[8px] mb-[2px]">
                                {activeGames[0]
                                    ? activeGames[0].token
                                    : "LOADING"}
                            </div>
                        </div>
                        <input
                            type="number"
                            className="w-[20%] outline-none flex items-end justify-end text-right mr-[15px] text-[1rem] border-none bg-transparent font-[Terminus] overflow-hidden select-none"
                            value={buyIn}
                            onChange={(e) =>
                                setBuyIn(parseFloat(e.target.value))
                            }
                            placeholder="0.1"
                            step={0.01}
                            min={0.1}
                        />
                    </div>

                    <div className="bg-black col-start-3 col-span-2 flex h-[2.5em] text-white ml-[0.5em] text-[1rem] font-[Terminus] items-center justify-center overflow-hidden">
                        <input
                            type="range"
                            className="slider h-[1px] bg-white outline-none"
                            min={0.1}
                            max={10.01}
                            step={0.1}
                            value={buyIn}
                            onChange={handleSliderChange}
                        />
                    </div>

                    <div className="col-start-1 col-span-2 justify-start items-center ml-[1vw]">
                        <div
                            className={`w-[43%] bg-white flex flex-col items-start justify-start rounded-[15px] fixed self-start ${expandlist ? "max-h-[25vh] h-[25vh]" : "max-h-auto h-auto"}`}
                        >
                            <div
                                className={`flex flex-row w-full pb-[0.4em] pt-[0.4em] bg-white z-10 border-b border-solid border-black rounded-tl-[10px] rounded-tr-[10px] ${expandlist ? "" : "rounded-bl-[10px] rounded-br-[10px]"}`}
                            >
                                <div
                                    onClick={() => {
                                        handleClick(0);
                                    }}
                                    className="w-[4vw] pt-[0.4em] flex items-center justify-center text-black cursor-pointer self-start text-[20px] font-[700]"
                                >
                                    {!openGameInfo[0] ? "+" : "-"}
                                </div>
                                <div className="font-[Conthrax] flex flex-col text-[1rem] text-black pt-[0.2em] oeverflow-hidden width-[100%]">
                                    <span className="opacity-70 text-[0.7rem] mt-[5px]"></span>
                                    <span>
                                        {activeGames.length > 0
                                            ? activeGames[0].name
                                            : "loading"}
                                    </span>
                                    {openGameInfo[0] ? (
                                        <>
                                            <span className="opacity-70 text-[0.7rem] mb-[5px]">
                                                players:{" "}
                                                {activeGames[0].active_players}{" "}
                                                / {activeGames[0].max_players}
                                            </span>
                                            <span className="opacity-70 text-[0.7rem] mb-[5px]">
                                                game size: {activeGames[0].size}
                                            </span>
                                            <span className="opacity-70 text-[0.7rem] mb-[5px]">
                                                game id:{" "}
                                                {activeGames[0].worldId.toString()}
                                            </span>
                                        </>
                                    ) : null}
                                </div>
                                <div
                                    className="ml-auto w-[2vw] pt-[0.8em] flex items-center self-start justify-end mr-[1vw] cursor-pointer"
                                    onClick={(e) => {
                                        setExpandlist(!expandlist);
                                        setOpenGameInfo(
                                            new Array(activeGames.length).fill(
                                                false,
                                            ),
                                        );
                                    }}
                                >
                                    <svg
                                        width="15"
                                        height="9"
                                        viewBox="0 0 10 6"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        className={`w-[1vw] h-auto transform ${expandlist ? "scale-y-[-1]" : "scale-y-[1]"} transform-origin-center`}
                                    >
                                        <path
                                            d="M5 6L9.33013 0H0.669873L5 6Z"
                                            fill="black"
                                        />
                                    </svg>
                                </div>
                            </div>
                            {expandlist ? (
                                <>
                                    <div
                                        className={`flex flex-col items-start overflow-y-auto fixed self-start w-[43%] rounded-t-[10px] rounded-bl-none rounded-br-none bg-white border-b border-solid border-black mt-0 ${expandlist ? "max-h-[20vh] h-[20vh]" : "h-[20vh]"}`}
                                    >
                                        {activeGames.map((item, index) => (
                                            <>
                                                <div
                                                    className={`flex flex-row w-full ${expandlist ? "pb-[0.15em]" : "pb-[0.4em]"} border-b border-solid border-black opacity-50 cursor-pointer`}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background =
                                                            "#FFEF8A";
                                                        e.currentTarget.style.opacity =
                                                            "1.0";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background =
                                                            "white";
                                                        e.currentTarget.style.opacity =
                                                            "0.5";
                                                    }}
                                                >
                                                    <div
                                                        className={`w-[3.2vw] flex items-center justify-center cursor-pointer self-start ${index === 0 ? "flex" : "flex"} mt-[0.7vh] text-[20px] font-bold`}
                                                        onClick={() =>
                                                            handleClick(index)
                                                        }
                                                    >
                                                        {!openGameInfo[index]
                                                            ? "+"
                                                            : "-"}
                                                    </div>
                                                    <div
                                                        className="gameInfo flex flex-col text-base overflow-hidden mb-[5px] mt-[0.15em] w-full"
                                                        onClick={() => {
                                                            const copiedActiveGameIds: ActiveGame[] =
                                                                [
                                                                    ...activeGames,
                                                                ];
                                                            const [item] =
                                                                copiedActiveGameIds.splice(
                                                                    index,
                                                                    1,
                                                                );
                                                            copiedActiveGameIds.unshift(
                                                                item,
                                                            );
                                                            setActiveGames(
                                                                copiedActiveGameIds,
                                                            );
                                                        }}
                                                    >
                                                        <span className="opacity-70 text-[0.7rem] mt-[5px] text-black"></span>
                                                        <span>
                                                            {" "}
                                                            {item.name}{" "}
                                                        </span>
                                                        {openGameInfo[index] ? (
                                                            <>
                                                                <span className="opacity-70 text-[0.7rem] mb-[5px]">
                                                                    players:{" "}
                                                                    {
                                                                        item.active_players
                                                                    }{" "}
                                                                    /{" "}
                                                                    {
                                                                        item.max_players
                                                                    }
                                                                </span>
                                                                <span className="opacity-70 text-[0.7rem] mb-[5px]">
                                                                    game size:{" "}
                                                                    {item.size}
                                                                </span>
                                                                <span className="opacity-70 text-[0.7rem] mb-[5px]">
                                                                    game id:{" "}
                                                                    {item.worldId.toString()}
                                                                </span>
                                                            </>
                                                        ) : null}
                                                    </div>
                                                    <div
                                                        className="ml-auto w-[2vw] pt-[0.8em] flex items-center self-start justify-end mr-[1vw] cursor-pointer"
                                                        onClick={(e) => {
                                                            setExpandlist(
                                                                !expandlist,
                                                            );
                                                            setOpenGameInfo(
                                                                new Array(
                                                                    activeGames.length,
                                                                ).fill(false),
                                                            );
                                                        }}
                                                    >
                                                        <svg
                                                            width="15"
                                                            height="9"
                                                            viewBox="0 0 10 6"
                                                            fill="none"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className={`w-[1vw] h-auto transform ${expandlist ? "scale-y-[-1]" : "scale-y-[1]"} transform-origin-center`}
                                                        >
                                                            <path
                                                                d="M5 6L9.33013 0H0.669873L5 6Z"
                                                                fill="black"
                                                            />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </>
                                        ))}
                                    </div>
                                    <div className="w-[85%] h-[3.5vh] bg-white opacity-50 rounded-[10px] mb-[0.7vh] ml-[1vw] border border-[#5f5f5f] flex items-center cursor-pointer overflow-hidden mt-auto">
                                        <img
                                            src={`${process.env.PUBLIC_URL}/magnifying-glass.png`}
                                            width="20px"
                                            height="auto"
                                            alt="Image"
                                            style={{
                                                marginLeft: "0.6vw",
                                                width: "1vw",
                                            }}
                                            onClick={handleImageClick}
                                        />
                                        <input
                                            type="text"
                                            className="bg-none border-none mr-[1vw] h-[80%] w-full text-black"
                                            placeholder="Search by game id"
                                            value={inputValue}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyPress}
                                        ></input>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </div>

                    <div className="col-span-1 items-center mr-[1vw]">
                        <button
                            className="w-full bg-white flex items-center justify-center h-[3em] rounded-[1em] border border-white font-[Conthrax] text-black text-base cursor-pointer transition-all duration-300 z-[10] hover:bg-black hover:text-[#eee] hover:border-white"
                            onClick={() => { navigate("/game"); joinGameTx(activeGames[0]);}}
                        >
                            Play
                        </button>
                    </div>

                    <div className="col-span-1 items-center mr-[1vw]">
                        <div className="play">
                            <button className="w-full bg-white flex items-center justify-center h-[3em] rounded-[1em] border border-white font-[Conthrax] text-black text-base cursor-pointer transition-all duration-300 z-[10] hover:bg-black hover:text-[#eee] hover:border-white" onClick={handleBuyClick}>
                                {`Buy ${activeGames[0] ? activeGames[0].token.toString().slice(0,7) : "LOADING"}`}
                            </button>
                        </div>
                        {/* <Link
                            className="w-full bg-white flex items-center text-center justify-center text-black h-[3em] rounded-[1em] border border-white font-[Conthrax] text-base cursor-pointer transition-all duration-300 hover:bg-black hover:text-[#eee]"
                            to={"/create-game"}
                        >
                            Create Game
                        </Link> */}
                    </div>
                </div>
            </div>

            {isSubmitting && isJoining && (
                <div className="fixed bottom-[120px] left-0 flex justify-center items-end w-full z-[1000]">
                    <div className="w-9 h-9 border-4 border-solid border-black/10 border-l-[#09f] rounded-full animate-spin"></div>
                </div>
            )}

            {transactionError && (
                <Alert
                    type="error"
                    message={transactionError}
                    onClose={() => setTransactionError(null)}
                />
            )}
            {transactionSuccess && !isJoining && (
                <Alert
                    type="success"
                    message={transactionSuccess}
                    onClose={() => setTransactionSuccess(null)}
                />
            )}
        </div>
    );
};

export default withMainLayout(Home);
