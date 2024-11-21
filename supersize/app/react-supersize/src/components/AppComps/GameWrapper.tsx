import React, { useState } from 'react';
import Button from '../Button';
import GameComponent from '../GameComponent';
import { PublicKey } from '@solana/web3.js';

interface GameWrapperProps {
    gameId: PublicKey | null;
    players: Blob[];
    visibleFood: Food[];
    currentPlayer: Blob | null;
    screenSize: { width: number; height: number };
    scale: number;
    gameEnded: number;
    playerCashout: number;
    playerTax: number;
    cashoutTx: string | null;
    reclaimTx: string | null;
    exitTxn: string;
    handleExitClick: () => void;
    setPlayerCashout: any
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
    removal: any; // Replace with proper BN type if needed
    target_x: number;
    target_y: number;
}

interface Food {
    x: number;
    y: number;
}

function GameWrapper({
    gameId,
    players,
    visibleFood,
    currentPlayer,
    screenSize,
    scale,
    gameEnded,
    playerCashout,
    playerTax,
    cashoutTx,
    reclaimTx,
    exitTxn,
    handleExitClick,
    setPlayerCashout
}: GameWrapperProps) {
    const [exitHovered, setExitHovered] = useState(false);
    const [playerExiting, setPlayerExiting] = useState(false);
    const [countdown, setCountdown] = useState(5);

    return (
        <div className="gameWrapper">
            <div id="status" style={{ display: gameId !== null ? 'block' : 'none', zIndex: 9999 }}><span className="title">Leaderboard</span></div>
            <div style={{ display: gameId !== null ? 'flex' : 'none', alignItems: 'center', position: 'fixed', top: 0, left: 0, margin: '10px', zIndex: 9999 }}
                onMouseEnter={() => { setExitHovered(true) }}
                onMouseLeave={() => { setExitHovered(false) }}>
                <Button buttonClass="exitButton" title={"X"} onClickFunction={handleExitClick} args={[]} />
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

            <div className="game" style={{ display: gameId !== null ? 'block' : 'none', height: screenSize.height * scale, width: screenSize.width * scale }}>
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
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <a
                                    className="superExitInfo"
                                    href={`https://explorer.solana.com/tx/${reclaimTx}?cluster=mainnet`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Reclaim SOL
                                </a>
                                {reclaimTx != null ? (
                                    <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" style={{ display: "inline", marginLeft: "5px", marginTop: "2px" }}>
                                        <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
                                        <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                                    </svg>
                                ) : (
                                    <svg width="52" height="52" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" stroke="#fff" style={{ display: "inline", marginLeft: "5px", marginTop: "2px", height: "20px", width: "20px" }}>
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
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <a
                                    className="superExitInfo"
                                    href={`https://explorer.solana.com/tx/${cashoutTx}?cluster=mainnet`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Cashout transaction
                                </a>
                                {cashoutTx != null ? (
                                    <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" style={{ display: "inline", marginLeft: "5px", marginTop: "2px" }}>
                                        <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
                                        <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                                    </svg>
                                ) : (
                                    <svg width="52" height="52" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" stroke="#fff" style={{ display: "inline", marginLeft: "5px", marginTop: "2px", height: "20px", width: "20px" }}>
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
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <a
                                    className="superExitInfo"
                                    href={`https://explorer.solana.com/tx/${reclaimTx}?cluster=mainnet`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Reclaim SOL
                                </a>
                                {reclaimTx != null ? (
                                    <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" style={{ display: "inline", marginLeft: "5px", marginTop: "2px" }}>
                                        <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
                                        <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                                    </svg>
                                ) : (
                                    <svg width="52" height="52" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" stroke="#fff" style={{ display: "inline", marginLeft: "5px", marginTop: "2px", height: "20px", width: "20px" }}>
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
                            <button id="returnButton" onClick={() => { window.location.reload(); setPlayerCashout(0); }}>Return home</button>
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
                            <button id="returnButton" onClick={() => { setPlayerCashout(0); window.location.reload(); }}>Return home</button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    )
}

export default GameWrapper
