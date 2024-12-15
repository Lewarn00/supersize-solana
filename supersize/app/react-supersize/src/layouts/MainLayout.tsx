import {
    PropsWithChildren,
    ComponentType,
    useState,
    useEffect,
    useCallback,
} from "react";
import Dropdown from "@components/Dropdown";
import WalletConnectButton from "@components/WalletConnectButton";
import TopNavText from "@components/TopNavText";
import SolNetStats from "@components/SolNetStats";
import FooterLink from "@components/FooterLink";
import LeaderboardButton from "@components/LeaderboardButton";
import { useNavigate } from "react-router-dom";
import useSupersize from "@hooks/useSupersize";
import ReferrerModal from "@components/ReferrerModal";
import CopyLink from "../components/buddyReferral";
import Invite from "../components/buddyInvite";
import TweetLink from "../components/buddyTweet";

const MainLayout = ({ children }: PropsWithChildren) => {
    const { currentTPS, price, isReferrerModalOpen, setIsReferrerModalOpen, setReferrerInput } = useSupersize();
    const [viewerIdx, setViewerIdx] = useState(0);
    const [footerVisible, setFooterVisible] = useState(false);

    const [gitbookHovered, setGitBookHovered] = useState(false);
    const [xHovered, setXHovered] = useState(false);
    const [tgHovered, setTgHovered] = useState(false);
    const [buildHovered, setBuildHovered] = useState(false);
    const navigate = useNavigate();

    const openDocs = useCallback(() => {
        window.open("https://docs.supersize.gg/", "_blank");
    }, []);
    const openX = useCallback(() => {
        window.open("https://x.com/SUPERSIZEgg", "_blank");
    }, []);
    const openTG = useCallback(() => {
        window.open("https://t.me/supersizeplayers", "_blank");
    }, []);

    useEffect(() => {
        const scrollableElement = document.querySelector(
            ".info-text-container",
        );
        if (!scrollableElement) return;

        console.log(scrollableElement);

        const handleScroll = () => {
            const scrollPosition = scrollableElement.scrollTop / 20;
            const image = document.querySelector(
                ".info-spinning-image",
            ) as HTMLImageElement;

            if (image) {
                console.log("Image found:", image);
                image.style.transform = `rotate(${scrollPosition}deg)`;
            } else {
                console.log("Image not found");
            }
        };

        scrollableElement.addEventListener("scroll", handleScroll);

        return () => {
            scrollableElement.removeEventListener("scroll", handleScroll);
        };
    }, [viewerIdx]);

    useEffect(() => {
        let scrollY = 0;
        const handleWheel = (event: WheelEvent) => {
            scrollY += event.deltaY;

            const element = document.querySelector(".info-text-container");
            let scrollTop = 0;
            if (element) {
                scrollTop = element.scrollTop;
            }
            scrollY += event.deltaY;

            if (scrollY > 20 && !element) {
                console.log("User has scrolled more than 50 pixels down.");
                setViewerIdx(1);
            } else if (scrollY < -20 && scrollTop === 0 && element) {
                console.log("User has scrolled more than 50 pixels up.");
                setViewerIdx(0);
            }
        };

        window.addEventListener("wheel", handleWheel);

        return () => {
            window.removeEventListener("wheel", handleWheel);
        };
    }, [viewerIdx]);

    useEffect(() => {
        const handleScroll = () => {
            const element = document.querySelector(".info-text-container");
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

        const element = document.querySelector(".info-text-container");
        if (element) {
            element.addEventListener("scroll", handleScroll);
            window.addEventListener("touchmove", handleTouchMove);
        }

        return () => {
            if (element) {
                element.removeEventListener("scroll", handleScroll);
                window.removeEventListener("touchmove", handleTouchMove);
            }
        };
    }, [viewerIdx]);

    const handleLeaderboadClick = useCallback(() => {
        navigate("/leaderboard");
    }, []);

    const handleCreateClick = useCallback(() => {
        setIsReferrerModalOpen(true);
    }, []);
    const handleCloseModal = useCallback(() => {
        console.log("hi")
        setIsReferrerModalOpen(false);
    }, []);
    console.log(isReferrerModalOpen)

    return (
        <section className={`${isReferrerModalOpen ? "bg-black bg-opacity-50" : ""}`}>
            {viewerIdx == 0 ? (
                <div className="flex justify-between items-center">
                    <Dropdown />
                    <TopNavText />
                    <div className="flex flex-row items-center">
                        <LeaderboardButton
                            handleLeaderboadClick={handleLeaderboadClick}
                        />
                        <WalletConnectButton />
                        <div
                        className="text-white font-[terminus] h-[6vh] mt-[15vh] cursor-pointer absolute right-[1vw] w-fit z-10 text-right"
                        >
                        <TweetLink />
                        <CopyLink handleCreateClick={handleCreateClick}/>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between z-10 backdrop-blur-[10px] h-[10vh] bg-opacity-30">
                    <div>
                        <span
                            className="text-white font-conthrax text-[3rem] pl-8 pt-2 z-10 opacity-100 cursor-pointer"
                            onClick={() => setViewerIdx(0)}
                        >
                            SUPERSIZE
                        </span>
                    </div>
                    {!footerVisible && (
                        <div className="inline-flex items-center mr-[1vw]">
                            <button
                                className="p-3 bg-white text-black flex items-center justify-center h-12 rounded-xl border border-white font-conthrax text-base cursor-pointer transition-all duration-300 z-10 hover:bg-black hover:text-gray-300 hover:border-white"
                                onClick={() => setViewerIdx(0)}
                            >
                                Play
                            </button>
                        </div>
                    )}
                </div>
            )}
            {viewerIdx == 0 ? (
                children
            ) : (
                <div className="info-container flex w-full overflow-y-auto mt-[-20vh] z-10">
                    {!footerVisible && (
                        <div
                            className="w-[35%] h-[100vh] flex justify-center items-center relative overflow-hidden opacity-100 transition-opacity duration-1000 ease-in-out"
                            style={{ zIndex: -1 }}
                        >
                            <img
                                src={`${process.env.PUBLIC_URL}/supersizemaybe.png`}
                                alt="Spinning"
                                className="info-spinning-image w-[50%] h-auto transition-transform duration-200 ease-out"
                            />
                        </div>
                    )}
                    <div
                        className={`info-text-container p-[20px] pt-[20vh] overflow-y-auto ${footerVisible ? "w-[100%] pl-0 pr-0" : "w-[65%] pl-[20px] pr-[6vw]"}`}
                    >
                        <div className="text-[5rem] md:text-[3rem] mt-0 md:mt-[0.5em] text-white font-[Terminus] h-[200%]">
                            <p>
                                Supersize is a live multiplayer feeding frenzy
                                game. Players must eat or be eaten to become the
                                biggest onchain.
                                <br></br>
                                <br></br>
                                Bigger players move slower than smaller players,
                                but can expend tokens to boost forward and eat
                                them. Click to boost.
                                <br></br>
                                <br></br>
                                Supersize is playable with any SPL token.
                                Players can exit the game at any time to receive
                                their score in tokens. <br></br>(3% tax on exit)
                                <br></br>
                                <br></br>
                                All game logic and state changes are securely
                                recorded on the Solana blockchain in real-time,{" "}
                                <br></br>powered by{" "}
                                <a
                                    href="https://www.magicblock.gg/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <img
                                        src={`${process.env.PUBLIC_URL}/magicblock_white_copy.svg`}
                                        alt="Spinning"
                                        className="w-[300px] inline-block"
                                    />
                                </a>
                            </p>
                            <div
                                className={`flex justify-between items-center p-5 bg-[#222] text-white transition-opacity duration-1000 ease-in-out relative top-[93vh] ${footerVisible ? "opacity-100" : "opacity-0"}`}
                            >
                                <div className="absolute top-[-50vh] left-[40vw] w-fit text-white font-terminus text-[0.5em] flex items-center justify-center flex-col">
                                    Join a game
                                    <div className="inline-flex items-center mt-[1vw]">
                                        <button
                                            className="w-full bg-white flex items-center text-black justify-center h-12 px-2 rounded-lg border border-white font-conthrax text-base cursor-pointer transition-opacity transition-colors ease-linear duration-300 z-10 hover:bg-black hover:text-gray-200 hover:shadow-none"
                                            onClick={() => {
                                                setViewerIdx(0);
                                            }}
                                        >
                                            Play Now
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-lg font-bold">
                                        <div className="text-base flex items-center m-2">
                                            © Supersize Inc. 2024
                                        </div>
                                    </span>
                                </div>
                                <div className="flex gap-[15px]">
                                    <div
                                        className="w-[35px] h-[40px] flex cursor-pointer items-center justify-center px-[3px]"
                                        onMouseEnter={() =>
                                            setBuildHovered(true)
                                        }
                                        onMouseLeave={() =>
                                            setBuildHovered(false)
                                        }
                                        onClick={() => { navigate('/create-game')}}
                                    >
                                        <img
                                            src={`${process.env.PUBLIC_URL}/build2.png`}
                                            alt="Image"
                                            className={` w-[23px] h-auto absolute ${buildHovered ? "opacity-20" : "opacity-80"} transition-opacity duration-300 ease-in-out`}
                                        />
                                        {buildHovered && (
                                            <img
                                                src={`${process.env.PUBLIC_URL}/buildhighlight2.png`}
                                                alt="Highlighted Image"
                                                className={`w-[23px] h-auto absolute ${buildHovered ? "opacity-80" : "opacity-20"} transition-opacity duration-300 ease-in-out`}
                                            />
                                        )}
                                    </div>

                                    <div
                                        className="w-[35px] h-[40px] flex cursor-pointer items-center justify-center px-[3px]"
                                        onMouseEnter={() =>
                                            setGitBookHovered(true)
                                        }
                                        onMouseLeave={() =>
                                            setGitBookHovered(false)
                                        }
                                        onClick={openDocs}
                                    >
                                        <img
                                            src={`${process.env.PUBLIC_URL}/GitBook.png`}
                                            alt="Image"
                                            className={` w-[23px] h-auto absolute ${gitbookHovered ? "opacity-20" : "opacity-80"} transition-opacity duration-300 ease-in-out`}
                                        />
                                        {gitbookHovered && (
                                            <img
                                                src={`${process.env.PUBLIC_URL}/GitBookhighlight.png`}
                                                alt="Highlighted Image"
                                                className={`w-[23px] h-auto absolute ${gitbookHovered ? "opacity-80" : "opacity-20"} transition-opacity duration-300 ease-in-out`}
                                            />
                                        )}
                                    </div>

                                    <div
                                        className="w-[35px] h-[40px] flex cursor-pointer items-center justify-center px-[3px]"
                                        onMouseEnter={() => setXHovered(true)}
                                        onMouseLeave={() => setXHovered(false)}
                                        onClick={openX}
                                    >
                                        <img
                                            src={`${process.env.PUBLIC_URL}/x-logo.png`}
                                            alt="Image"
                                            className={` w-[23px] h-auto absolute ${xHovered ? "opacity-20" : "opacity-80"} transition-opacity duration-300 ease-in-out`}
                                        />
                                        {xHovered && (
                                            <img
                                                src={`${process.env.PUBLIC_URL}/x-logo-highlight.png`}
                                                alt="Highlighted Image"
                                                className={`w-[23px] h-auto absolute ${xHovered ? "opacity-80" : "opacity-20"} transition-opacity duration-300 ease-in-out`}
                                            />
                                        )}
                                    </div>

                                    <div
                                        className="w-[35px] h-[40px] flex cursor-pointer items-center justify-center px-[3px]"
                                        onMouseEnter={() => setTgHovered(true)}
                                        onMouseLeave={() => setTgHovered(false)}
                                        onClick={openTG}
                                    >
                                        <img
                                            src={`${process.env.PUBLIC_URL}/tg2.png`}
                                            alt="Image"
                                            className={` w-[23px] h-auto absolute ${tgHovered ? "opacity-20" : "opacity-80"} transition-opacity duration-300 ease-in-out`}
                                        />
                                        {tgHovered && (
                                            <img
                                                src={`${process.env.PUBLIC_URL}/tg.png`}
                                                alt="Highlighted Image"
                                                className={`w-[23px] h-auto absolute ${tgHovered ? "opacity-80" : "opacity-20"} transition-opacity duration-300 ease-in-out`}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {
                viewerIdx == 0 && isReferrerModalOpen && <ReferrerModal handleCloseModal={handleCloseModal}/>
            }
            {viewerIdx == 0 ? (
                <div className="flex justify-between items-center" style={{height: 0}}>
                    <SolNetStats tps={currentTPS} price={price} />
                    <div className="h-10 absolute flex items-center justify-center p-2 mx-auto w-full text-white font-mono flex-col cursor-pointer">
                        Learn More
                        <img
                            src={`${process.env.PUBLIC_URL}/morearrow.png`}
                            className="mt-0 w-5 h-auto animate-bounce cursor-pointer"
                            alt="Image"
                        />
                    </div>
                    <FooterLink />
                </div>
            ) : (
                <></>
            )}
        </section>
    );
};

export const withMainLayout =
    <P extends object>(Component: ComponentType<P>) =>
    (Props: P) => (
        <MainLayout>
            <Component {...Props} />
        </MainLayout>
    );
