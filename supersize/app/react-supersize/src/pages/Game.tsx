import React, { useState } from "react";
import GameComponent from "@components/Game";
import { PublicKey } from "@solana/web3.js";
import { useNavigate } from "react-router-dom";
import { useSupersizeContext } from "@contexts/SupersizeContext";
import { scale } from "@utils/constants";
import useSupersize from "@hooks/useSupersize";

const Game = () => {
    const navigate = useNavigate();
    const {
        gameId,
        gameEnded,
        playerExiting,
        countdown,
        screenSize,
        reclaimTx,
        cashoutTx,
        handleExitClick,
        players,
        visibleFood,
        currentPlayer,
        cleanUp,
    } = useSupersizeContext();

    const [exitHovered, setExitHovered] = useState(false);

    return (
        <div className="gameWrapper w-screen h-screen overflow-hidden">
            <div
                id="status"
                className={`${
                    gameId !== null ? "block" : "hidden"
                } absolute p-2.5 bg-[rgba(17,19,20,0.4)] text-white font-['Terminus'] text-[16.1px] top-2.5 right-2.5 font-bold text-center rounded-[5px] border border-gray-400 filter drop-shadow-[0px_0px_5px_gray]`}
                style={{ zIndex: 9999 }}
            >
                <span className="font-[25px] text-white">Leaderboard</span>
            </div>

            <div
                className={`${
                    gameId !== null ? "block" : "hidden"
                } flex items-center fixed top-0 left-0 m-2.5 z-[9999]`}
                style={{ zIndex: 9999 }}
                onMouseEnter={() => {
                    setExitHovered(true);
                }}
                onMouseLeave={() => {
                    setExitHovered(false);
                }}
            >
                <button
                    className="flex items-center justify-center text-center relative box-border text-sm cursor-pointer text-black no-underline bg-[#f07171] float-right border border-[#f07171] rounded-full py-1.5 px-2.5 transition-colors duration-300 z-[9999999] hover:bg-black hover:text-[#f07171] active:bg-black active:text-[#f07171]"
                    onClick={handleExitClick}
                >
                    X
                </button>
                {playerExiting && countdown > 0 && (
                    <div className="block text-[#f07171] font-[Terminus] text-xl text-right ml-2.5">
                        Disconnecting in {countdown} seconds
                    </div>
                )}
            </div>

            <div
                className={`${
                    gameId !== null ? "block" : "hidden"
                } fixed bottom-0 left-0 m-2 z-[9999] text-white text-base font-[terminus] flex flex-col`}
            >
                <div>
                    <span className="opacity-50">Your size: </span>
                    <span className="opacity-100">
                        {currentPlayer ? currentPlayer.score : null}
                    </span>
                </div>
            </div>

            <div
                className="game"
                style={{
                    display: gameId !== null ? "block" : "none",
                    height: screenSize.height * scale,
                    width: screenSize.width * scale,
                }}
            >
                <GameComponent
                    gameId={gameId}
                    players={players}
                    visibleFood={visibleFood.flat()}
                    currentPlayer={currentPlayer}
                    screenSize={screenSize}
                    scale={scale}
                />
            </div>

            <div
                className={`${
                    gameId === null ? "block" : "hidden"
                } w-screen h-screen`}
            >
                {gameEnded === 1 && (
                    <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black z-[9999]">
                        <div className="bg-black flex flex-col items-center justify-center">
                            <p className="font-terminus p-0 m-1 text-center text-white text-xl inline">
                                You got eaten!
                            </p>
                            <button
                                id="returnButton"
                                onClick={() => navigate("/")}
                            >
                                Return home
                            </button>
                        </div>
                    </div>
                )}

                {(gameEnded === 2 || gameEnded === 3) && (
                    <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black z-[9999]">
                        <div className="bg-black flex flex-col items-center justify-center select-text">
                            <p className="font-terminus p-0 m-1 text-center text-white text-xl inline">
                                Final score: {currentPlayer ? currentPlayer.score + currentPlayer.tax : ''}
                            </p>
                            <p className="font-terminus p-0 m-1 text-center text-white text-xl inline">
                                Exit tax:{" "}
                                {currentPlayer ? currentPlayer.tax + currentPlayer.score * 0.02 : ''}
                            </p>
                            <p className="font-terminus p-0 m-1 text-center text-white text-xl inline">
                                Payout: {currentPlayer ? currentPlayer.score * 0.98 : ''}
                            </p>
                            <div
                                className="flex items-center justify-center"
                                style={{ flexDirection: "column" }}
                            >
                                <pre style={{ margin: "20px 0" }}>
                                    {cashoutTx !== null &&
                                    cashoutTx !== "error" ? (
                                        <a
                                            className="font-terminus p-0 m-1 text-center text-white text-xl inline"
                                            href={`https://explorer.solana.com/tx/${cashoutTx}?cluster=mainnet`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{textDecoration: 'underline'}}
                                        >
                                            Cashout transaction
                                        </a>
                                    ) : (
                                        <span className="warning-alert">Confirm the cashout TX in your wallet</span>
                                    )}
                                </pre>
                                {cashoutTx != null ? (
                                    <>
                                        {cashoutTx != "error" ? (
                                            <svg
                                                className="w-5 h-5 rounded-full inline-block stroke-[2px] stroke-[#15bd12] stroke-miter-10 shadow-inner ml-[5px] mt-[2px]"
                                                style={{
                                                    animation:
                                                        "fill 0.4s ease-in-out 0.4s forwards, scale 0.3s ease-in-out 0.9s both;",
                                                }}
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 52 52"
                                            >
                                                <circle
                                                    className="stroke-[2px] stroke-[#15bd12] stroke-miter-10 fill-[#15bd12]"
                                                    style={{
                                                        strokeDasharray:
                                                            "166; stroke-dashoffset: 166; animation: stroke 0.6s cubic-bezier(0.650, 0.000, 0.450, 1.000) forwards;",
                                                    }}
                                                    cx="26"
                                                    cy="26"
                                                    r="25"
                                                    fill="none"
                                                />
                                                <path
                                                    className="stroke-[white] stroke-dasharray-[48] stroke-dashoffset-[48] transform-origin-[50%_50%] animation-stroke"
                                                    fill="none"
                                                    d="M14.1 27.2l7.1 7.2 16.7-16.8"
                                                />
                                            </svg>
                                        ) : (
                                            <button
                                                className="w-full bg-white flex items-center justify-center h-[3em] rounded-[1em] border border-white font-[Conthrax] text-black text-base cursor-pointer transition-all duration-300 z-[10] hover:bg-black hover:text-[#eee] hover:border-white"
                                                onClick={() => cleanUp()}
                                            >
                                                Retry
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <svg
                                        className="inline ml-[5px] mt-[2px] h-[20px] w-[20px] stroke-[white]"
                                        width="52"
                                        height="52"
                                        viewBox="0 0 38 38"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <g fill="none" fillRule="evenodd">
                                            <g
                                                transform="translate(1 1)"
                                                strokeWidth="2"
                                            >
                                                <circle
                                                    strokeOpacity=".5"
                                                    cx="18"
                                                    cy="18"
                                                    r="18"
                                                />
                                                <path d="M36 18c0-9.94-8.06-18-18-18">
                                                    <animateTransform
                                                        attributeName="transform"
                                                        type="rotate"
                                                        from="0 18 18"
                                                        to="360 18 18"
                                                        dur="1s"
                                                        repeatCount="indefinite"
                                                    />
                                                </path>
                                            </g>
                                        </g>
                                    </svg>
                                )}
                            </div>
                            {cashoutTx !== null && cashoutTx !== "error" && (
                                <button
                                    id="returnButton"
                                    onClick={() => navigate("/")}
                                >
                                    Return home
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {gameEnded === 4 && (
                    <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black z-[9999]">
                        <div className="bg-black flex flex-col items-center justify-center select-text">
                            <p className="font-[Terminus] text-red-600 text-center text-sm m-0 p-0">
                                Error encountered during payout
                            </p>
                            <p className="font-[Terminus] text-white text-center text-sm m-0 p-[10px]">
                                <>
                                    If no transaction is received after a few
                                    minutes, contact @cheapnumbers on X
                                </>
                                <br />
                                <br />
                                Txn Receipt:
                            </p>
                            <button
                                id="returnButton"
                                onClick={() => navigate("/")}
                            >
                                Return home
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Game;
