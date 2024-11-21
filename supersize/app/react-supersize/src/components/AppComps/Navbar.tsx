import { PublicKey } from '@solana/web3.js';
import React from 'react'
import Button from '../Button';

interface NavbarProps {
    gameId: PublicKey | null;
    gameEnded: number;
    buildViewerNumber: number;
    isMobile: boolean;
    setIsDropdownOpen: any;
    isDropdownOpen: boolean;
    selectedOption: string;
    handleOptionClick: (option: string) => void;
    options: string[];
    setbuildViewerNumber: (value: number) => void;
    setIsHovered: (value: boolean[]) => void;
    isHovered: boolean[];
    footerVisible: boolean;
    activeGames: { image: string; token: string }[];
    WalletMultiButton: React.ComponentType;
}

function Navbar({
    gameId,
    gameEnded,
    buildViewerNumber,
    isMobile,
    setIsDropdownOpen,
    isDropdownOpen,
    selectedOption,
    handleOptionClick,
    options,
    setbuildViewerNumber,
    setIsHovered,
    isHovered,
    footerVisible,
    activeGames,
    WalletMultiButton,
}: NavbarProps) {
    return (
        <div className="topbar" style={{ display: gameId == null && gameEnded == 0 ? 'flex' : 'none', background: buildViewerNumber == 1 ? "rgba(0, 0, 0, 0.3)" : "rgb(0, 0, 0)", height: isMobile && buildViewerNumber == 1 ? '20vh' : buildViewerNumber == 1 ? '10vh' : '4vh', zIndex: 9999999 }}>
            {buildViewerNumber == 0 ? (
                <>
                    <div
                        className="dropdown-container"
                        onClick={() => setIsDropdownOpen((prev: boolean) => !prev)}
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
                    <span className="free-play text-6xl bg-red-500" style={{ color: "#FFEF8A", borderColor: "#FFEF8A", marginLeft: "0vw", width: "fit-content", paddingLeft: "10px", paddingRight: "10px", marginTop: "5vh", background: "black" }}>Supersize is an eat or be eaten multiplayer game, live on the Solana blockchain</span>
                </>
            ) :
                (
                    <div>
                        <>
                            {buildViewerNumber == 1 ?
                                (
                                    <span className="titleText" style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); setbuildViewerNumber(0); }}> SUPERSIZE </span>
                                ) : (
                                    <div>
                                        <>
                                            <div
                                                style={{
                                                    width: '4vh',
                                                    height: '4vh',
                                                    display: 'flex',
                                                    cursor: "pointer",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    marginLeft: "2vw",
                                                    marginTop: "4vh"
                                                }}
                                                onMouseEnter={() => setIsHovered([false, false, false, false, false, true])}
                                                onMouseLeave={() => setIsHovered([false, false, false, false, false, false])}
                                                onClick={() => { setbuildViewerNumber(0); setIsHovered([false, false, false, false, false]); }}
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
            <div className="left-side" style={{ alignItems: "center", justifyContent: "center", display: 'flex', zIndex: 9999999 }}>
                <>
                    {buildViewerNumber != 1 ? (
                        <div className="wallet-buttons" style={{ marginTop: "0vh", zIndex: 9999999 }}>
                            <WalletMultiButton />
                        </div>
                    ) : (
                        <div className="play" style={{ display: footerVisible ? "none" : 'flex' }}>
                            <Button  buttonClass="playButton" title={"Play"} onClickFunction={() => { setbuildViewerNumber(0); }} args={[activeGames[0]]} />
                        </div>
                    )}
                </>
            </div>
        </div>
    )
}

export default Navbar
