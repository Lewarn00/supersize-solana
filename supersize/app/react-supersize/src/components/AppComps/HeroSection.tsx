import React from 'react'
import Button from '../Button'
import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js';

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

interface HeroSectionProps {
  gameId: PublicKey | null
  gameEnded: number
  playerName: string
  handleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  activeGames: ActiveGame[]
  buyIn: number
  setBuyIn: (value: number) => void
  expandlist: boolean
  setexpandlist: (value: boolean) => void
  openGameInfo: boolean[]
  setOpenGameInfo: (value: boolean[]) => void
  handleClick: (index: number) => void
  inputValue: string
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void
  handleImageClick: () => void
  joinGameTx: (game: ActiveGame) => void
  setbuildViewerNumber: (value: number) => void
  handleSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  setActiveGames: any
}

function HeroSection({
  gameId,
  gameEnded,
  playerName,
  handleNameChange,
  activeGames,
  buyIn,
  setBuyIn,
  expandlist,
  setexpandlist,
  openGameInfo,
  setOpenGameInfo,
  handleClick,
  inputValue,
  handleInputChange,
  handleKeyPress,
  handleImageClick,
  joinGameTx,
  setbuildViewerNumber,
  handleSliderChange,
  setActiveGames
}: HeroSectionProps) {
    return (
        <div className="game-select" style={{ display: gameId == null && gameEnded == 0 ? 'flex' : 'none' }}>
            <div className="select-background">
                <img className="logo-image" src={`${process.env.PUBLIC_URL}/token.png`} width="30vw" height="auto" alt="Image" />
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
                        <div className="buyInInfo" style={{ marginLeft: "5px", width: "30%", display: "flex", alignItems: "center" }}>
                            <img src={activeGames[0] ? activeGames[0].image : `${process.env.PUBLIC_URL}/token.png`} width="20px" height="auto" alt="Image" style={{ alignItems: "center", justifyContent: "center" }} />
                            <div style={{ height: "20px", display: 'inline', marginLeft: "8px", marginTop: "3px" }}>{activeGames[0] ? activeGames[0].token : "LOADING"}</div>
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
                        <div className="gameSelectButton" style={{ maxHeight: expandlist ? "25vh" : "auto", height: expandlist ? "25vh" : "auto" }}>
                            <div style={{ display: "flex", flexDirection: "row", width: "100%", paddingBottom: "0.4em", paddingTop: "0.4em", borderBottom: "1px solid", background: "white", zIndex: "999", borderBottomLeftRadius: expandlist ? "0px" : "10px", borderBottomRightRadius: expandlist ? "0px" : "10px", borderTopLeftRadius: "10px", borderTopRightRadius: "10px", borderColor: "#5f5f5f" }}>
                                <div onClick={() => { handleClick(0); }} style={{ width: "4vw", paddingTop: "0.4em", alignItems: 'center', justifyContent: 'center', cursor: "pointer", alignSelf: "flex-start", display: "flex", fontSize: "20px", fontWeight: "700" }}>
                                    {!openGameInfo[0] ? "+" : "-"}
                                </div>
                                <div className="gameInfo" style={{ display: "flex", flexDirection: "column", fontSize: "1rem", paddingTop: "0.2em", overflow: "hidden", width: "100%" }}>
                                    <span style={{ opacity: "0.7", fontSize: "0.7rem", marginBottom: "5px" }}></span>
                                    <span>{activeGames.length > 0 ? activeGames[0].name : "loading"} {/*<p style={{opacity: "0.7", fontSize:"10px", display:"inline-flex"}}>[demo]</p> */}</span>
                                    {openGameInfo[0] ? (
                                        <>
                                            <span style={{ opacity: "0.7", fontSize: "0.7rem", marginBottom: "5px" }}>players: {activeGames[0].active_players} / {activeGames[0].max_players}</span>
                                            <span style={{ opacity: "0.7", fontSize: "0.7rem", marginBottom: "5px" }}>game size: {activeGames[0].size}</span>
                                            <span style={{ opacity: "0.7", fontSize: "0.7rem", marginBottom: "5px" }}>game id: {activeGames[0].worldId.toString()}</span>
                                        </>
                                    ) : null}
                                </div>
                                <div style={{ marginLeft: "auto", width: "2vw", paddingTop: "0.8em", alignItems: 'center', alignSelf: "flex-start", justifyContent: 'flex-end', marginRight: "1vw", cursor: "pointer", display: "flex" }} onClick={(e) => { setexpandlist(!expandlist); setOpenGameInfo(new Array(activeGames.length).fill(false)); }}>
                                    <svg width="15" height="9" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "1vw", height: 'auto', transform: expandlist ? "scaleY(-1)" : "scaleY(1)", transformOrigin: 'center' }}>
                                        <path d="M5 6L9.33013 0H0.669873L5 6Z" fill="black" />
                                    </svg>
                                </div>
                            </div>
                            {expandlist ? (
                                <>
                                    <div className="gameInfoContainer" style={{ maxHeight: expandlist ? "20vh" : "auto", height: "20vh" }}>
                                        {activeGames.map((item, index) => (
                                            <>
                                                <div style={{ display: "flex", flexDirection: "row", width: "100%", paddingTop: "0.4em", paddingBottom: !expandlist ? "0.4em" : "0.15em", borderBottom: "1px solid", borderColor: "#5f5f5f", opacity: "0.5", cursor: "pointer" }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#FFEF8A'; e.currentTarget.style.opacity = '1.0'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.opacity = '0.5'; }}>
                                                    <div style={{ width: "3.2vw", alignItems: 'center', justifyContent: 'center', cursor: "pointer", alignSelf: "flex-start", display: index == 0 ? 'flex' : 'flex', marginTop: "0.7vh", fontSize: "20px", fontWeight: "700" }} onClick={() => { handleClick(index); }}>
                                                        {!openGameInfo[index] ? "+" : "-"}
                                                    </div>
                                                    <div className="gameInfo" style={{ display: "flex", flexDirection: "column", fontSize: "1rem", overflow: "hidden", marginBottom: "5px", marginTop: "0.15em", width: "100%" }}
                                                        onClick={() => {
                                                            const copiedActiveGameIds: ActiveGame[] = [...activeGames];
                                                            const [item] = copiedActiveGameIds.splice(index, 1);
                                                            copiedActiveGameIds.unshift(item);
                                                            setActiveGames(copiedActiveGameIds);
                                                        }}>
                                                        <span style={{ opacity: "0.7", fontSize: "0.7rem", marginBottom: "5px" }}></span>
                                                        <span> {item.name} {/* <p style={{opacity: "0.7", fontSize:"10px", display:"inline-flex"}}>[demo]</p> */}</span>
                                                        {openGameInfo[index] ? (
                                                            <>
                                                                <span style={{ opacity: "0.7", fontSize: "0.7rem", marginBottom: "5px" }}>players: {item.active_players} / {item.max_players}</span>
                                                                <span style={{ opacity: "0.7", fontSize: "0.7rem", marginBottom: "5px" }}>game size: {item.size}</span>
                                                                <span style={{ opacity: "0.7", fontSize: "0.7rem", marginBottom: "5px" }}>game id: {item.worldId.toString()}</span>
                                                            </>
                                                        ) : null}
                                                    </div>
                                                    <div style={{ marginLeft: "auto", width: "2vw", height: "100%", display: index == 0 ? 'flex' : 'none', alignItems: 'center', justifyContent: 'flex-end', marginRight: "1vw", cursor: "pointer" }}>
                                                        <svg width="15" height="9" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "1vw", height: 'auto' }}>
                                                            <path d="M5 6L9.33013 0H0.669873L5 6Z" fill="black" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </>
                                        ))}

                                    </div>
                                    <div className="searchbox" style={{ marginTop: "auto" }}>
                                        <img src={`${process.env.PUBLIC_URL}/magnifying-glass.png`} width="20px" height="auto" alt="Image" style={{ marginLeft: "0.6vw", width: "1vw" }} onClick={handleImageClick} />
                                        <input type="text" className="text-input" placeholder="Search by game id" style={{ background: "none", border: "none", marginRight: "1vw", height: "80%", width: "100%" }}
                                            value={inputValue}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyPress}
                                        >
                                        </input>
                                    </div>
                                </>) : null}
                        </div>
                    </div>
                    <div className="play">
                        <Button buttonClass="playButton" title={"Play"} onClickFunction={joinGameTx} args={[activeGames[0]]} />
                    </div>
                    <div className="play">
                        <Button buttonClass="createGameButton" title={"Create Game"} onClickFunction={() => setbuildViewerNumber(5)} />
                    </div>
                </div>
            </div>

        </div>
    )
}

export default HeroSection
