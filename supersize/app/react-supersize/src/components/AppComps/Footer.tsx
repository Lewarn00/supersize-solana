import { PublicKey } from '@solana/web3.js';
import React from 'react'

interface FooterProps {
    gameId: PublicKey | null;
    gameEnded: number;
    buildViewerNumber: number;
    isMobile: boolean;
    currentTPS: number;
    price: number;
    isHovered: boolean[];
    setIsHovered: (value: boolean[]) => void;
    setbuildViewerNumber: (value: number) => void;
    openDocs: () => void;
    openX: () => void;
    openTG: () => void;
}

function Footer({
    gameId,
    gameEnded,
    buildViewerNumber,
    isMobile,
    currentTPS,
    price,
    isHovered,
    setIsHovered,
    setbuildViewerNumber,
    openDocs,
    openX,
    openTG,
}: FooterProps) {
    return (
        <div className="linksFooter" style={{ display: gameId == null && gameEnded == 0 && buildViewerNumber != 1 ? 'flex' : 'none', alignItems: "center", justifyContent: "center" }}>
            <div style={{ height: "40px", alignItems: "center", justifyContent: "center", display: !isMobile ? 'flex' : 'none', padding: "10px", marginLeft: "2vw", color: "white", fontFamily: "terminus" }}>
                <div className="tps">TPS: {currentTPS}</div>
                <div className="solprice"><img src={`${process.env.PUBLIC_URL}/solana-logo.png`} width="20px" height="auto" alt="Image" style={{ width: "1vw", marginRight: "10px" }} /> ${Math.round(price)}</div>
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
                    cursor: "pointer"
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
            <div className="solstats" style={{ display: !isMobile ? 'flex' : 'none' }}>
                <div
                    style={{
                        width: '35px',
                        height: '40px',
                        display: 'flex',
                        cursor: "pointer",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRight: "1px solid #FFFFFF4D",
                        paddingLeft: "3px",
                        paddingRight: "3px",
                    }}
                    onMouseEnter={() => setIsHovered([false, false, true, false, false])}
                    onMouseLeave={() => setIsHovered([false, false, false, false, false])}
                    onClick={openDocs}
                >
                   <svg 
                       fill={isHovered[2] ? "gold" : "white"} 
                       viewBox="0 0 24 24" 
                       role="img" 
                       xmlns="http://www.w3.org/2000/svg"
                   >
                       <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                       <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                       <g id="SVGRepo_iconCarrier">
                           <path d="M10.802 17.77a.703.703 0 1 1-.002 1.406.703.703 0 0 1 .002-1.406m11.024-4.347a.703.703 0 1 1 .001-1.406.703.703 0 0 1-.001 1.406m0-2.876a2.176 2.176 0 0 0-2.174 2.174c0 .233.039.465.115.691l-7.181 3.823a2.165 2.165 0 0 0-1.784-.937c-.829 0-1.584.475-1.95 1.216l-6.451-3.402c-.682-.358-1.192-1.48-1.138-2.502.028-.533.212-.947.493-1.107.178-.1.392-.092.62.027l.042.023c1.71.9 7.304 3.847 7.54 3.956.363.169.565.237 1.185-.057l11.564-6.014c.17-.064.368-.227.368-.474 0-.342-.354-.477-.355-.477-.658-.315-1.669-.788-2.655-1.25-2.108-.987-4.497-2.105-5.546-2.655-.906-.474-1.635-.074-1.765.006l-.252.125C7.78 6.048 1.46 9.178 1.1 9.397.457 9.789.058 10.57.006 11.539c-.08 1.537.703 3.14 1.824 3.727l6.822 3.518a2.175 2.175 0 0 0 2.15 1.862 2.177 2.177 0 0 0 2.173-2.14l7.514-4.073c.38.298.853.461 1.337.461A2.176 2.176 0 0 0 24 12.72a2.176 2.176 0 0 0-2.174-2.174"></path>
                       </g>
                   </svg>
                </div>
                <div
                    style={{
                        width: '35px',
                        height: '40px',
                        display: 'flex',
                        cursor: "pointer",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingLeft: "5px",
                        paddingRight: "5px",
                        borderRight: "1px solid #FFFFFF4D",
                    }}
                    onMouseEnter={() => setIsHovered([false, false, false, true, false])}
                    onMouseLeave={() => setIsHovered([false, false, false, false, false])}
                    onClick={openX}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        shape-rendering="geometricPrecision"
                        text-rendering="geometricPrecision"
                        image-rendering="optimizeQuality"
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        viewBox="0 0 512 462.799"
                        fill={isHovered[3] ? "gold" : "white"}
                    >
                        <path fill-rule="nonzero" d="M403.229 0h78.506L310.219 196.04 512 462.799H354.002L230.261 301.007 88.669 462.799h-78.56l183.455-209.683L0 0h161.999l111.856 147.88L403.229 0zm-27.556 415.805h43.505L138.363 44.527h-46.68l283.99 371.278z" />
                    </svg>
                </div>
                <div
                    style={{
                        width: '45px', // Increased width
                        height: '40px', // Increased height
                        display: 'flex',
                        alignItems: "center",
                        justifyContent: "center",
                        borderRight: "1px solid #FFFFFF4D",
                        paddingLeft: "10px",
                        paddingRight: "10px",
                        cursor: "pointer",
                    }}
                    onMouseEnter={() => setIsHovered([false, false, false, false, true])}
                    onMouseLeave={() => setIsHovered([false, false, false, false, false])}
                    onClick={openTG}
                >
                  <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="80" // Increased width
                      height="80" // Increased height
                      viewBox="0 0 24 24"
                      style={{
                          fill: isHovered[4] ? "gold" : "white", // Change color to gold on hover
                          transform: "",
                          msFilter: ""
                      }}
                  >
                      <path d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z"></path>
                  </svg>
                </div>
                <div className="csupersize">© Supersize Inc. 2024</div>
            </div>
        </div>
    )
}

export default Footer
