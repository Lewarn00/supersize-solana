import { PropsWithChildren, ComponentType, useState, useCallback } from "react";
import Dropdown from "@components/Dropdown";
import WalletConnectButton from "@components/WalletConnectButton";
import SolNetStats from "@components/SolNetStats";
import FooterLink from "@components/FooterLink";
import { useNavigate } from "react-router-dom";
import LeaderboardButton from "@components/LeaderboardButton";

const GameLayout = ({ children }: PropsWithChildren) => {
    const [homeHovered, setHomeHovered] = useState(false);
    const navigate = useNavigate();

    const handleClickHome = useCallback(() => {
        navigate("/");
    }, []);

    const handleLeaderboadClick = useCallback(() => {
        navigate("/leaderboard");
    }, []);

    return (
        <section className="">
            <div className="flex justify-between items-center">
                <div
                    className="w-[4vh] h-[4vh] flex cursor-pointer items-center justify-center ml-[2vw] mt-[4vh]"
                    onMouseEnter={() => {
                        setHomeHovered(true);
                    }}
                    onMouseLeave={() => {
                        setHomeHovered(false);
                    }}
                    onClick={handleClickHome}
                >
                    <img
                        src={`${process.env.PUBLIC_URL}/home.png`}
                        alt="Image"
                        className={` w-[35px] h-auto absolute ${homeHovered ? "opacity-20" : "opacity-80"} transition-opacity duration-300 ease-in-out`}
                    />
                    {homeHovered && (
                        <img
                            src={`${process.env.PUBLIC_URL}/homehighlight.png`}
                            alt="Image"
                            className={` w-[35px] h-auto absolute ${homeHovered ? "opacity-80" : "opacity-20"} transition-opacity duration-300 ease-in-out`}
                        />
                    )}
                </div>

                <div className="flex flex-row items-center">
                    <LeaderboardButton
                        handleLeaderboadClick={handleLeaderboadClick}
                    />
                    <WalletConnectButton />
                </div>
            </div>
            {children}
            <div className="flex justify-between items-center">
                <SolNetStats tps={238722} price={239} />
                <FooterLink />
            </div>
        </section>
    );
};

export const withGameLayout =
    <P extends object>(Component: ComponentType<P>) =>
    (Props: P) => (
        <GameLayout>
            <Component {...Props} />
        </GameLayout>
    );
