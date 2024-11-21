import React from 'react'
import Button from '../Button';
import { PublicKey } from '@solana/web3.js';

interface InfoProps {
  gameId: PublicKey | null;
  gameEnded: number;
  footerVisible: boolean;
  isHovered: boolean[];
  setIsHovered: (value: boolean[]) => void;
  setbuildViewerNumber: (value: number) => void;
  activeGames: any[]; // You might want to replace 'any' with a more specific type
  openDocs: () => void;
  openX: () => void;
  openTG: () => void;
}

function Info({
  gameId,
  gameEnded,
  footerVisible,
  isHovered,
  setIsHovered,
  setbuildViewerNumber,
  activeGames,
  openDocs,
  openX,
  openTG
}: InfoProps) {
    return (
        <div className="info-container" style={{ display: gameId == null && gameEnded == 0 ? 'flex' : 'none' }}>
            <div className="info-image-container" style={{ display: footerVisible ? 'none' : 'flex', opacity: footerVisible ? "0" : "1", zIndex: "-1" }}>
                <img src={`${process.env.PUBLIC_URL}/supersizemaybe.png`} alt="Spinning" className="info-spinning-image" />
            </div>
            <div className="info-text-container" style={{ width: footerVisible ? '100%' : '65%', paddingLeft: footerVisible ? '0' : '20px', paddingRight: footerVisible ? '0' : '6vw' }}>
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
                            <img src={`${process.env.PUBLIC_URL}/magicblock_white_copy.svg`} alt="Spinning" className="info-spinning-image" style={{ width: "300px", marginTop: "50px", display: "inline-block" }} />
                        </a>
                    </p>
                    <div className={`info-footer ${footerVisible ? 'visible' : ''}`}>
                        <div style={{ position: "absolute", top: "-50vh", left: "40vw", width: "fit-content", color: "white", fontFamily: "Terminus", fontSize: "0.5em", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                            Join a game
                            <div className="play" style={{ marginTop: "1vw" }}>
                                <Button buttonClass="playNowButton" title={"Play Now"} onClickFunction={() => { setbuildViewerNumber(0); }} args={[activeGames[0]]} />
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
                                    alignItems: "center",
                                    justifyContent: "center",
                                    paddingLeft: "3px",
                                    paddingRight: "0px",
                                }}
                                onMouseEnter={() => setIsHovered([false, false, true, false, false])}
                                onMouseLeave={() => setIsHovered([false, false, false, false, false])}
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
                                    alignItems: "center",
                                    justifyContent: "center",
                                    paddingLeft: "0px",
                                    paddingRight: "0px",
                                }}
                                onMouseEnter={() => setIsHovered([false, false, false, true, false])}
                                onMouseLeave={() => setIsHovered([false, false, false, false, false])}
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
                                    alignItems: "center",
                                    justifyContent: "center",
                                    paddingRight: "10px",
                                    cursor: "pointer",
                                }}
                                onMouseEnter={() => setIsHovered([false, false, false, false, true])}
                                onMouseLeave={() => setIsHovered([false, false, false, false, false])}
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
    )
}

export default Info
