import { PropsWithChildren, ComponentType, useState, useCallback } from "react";
import Dropdown from "@components/Dropdown";
import WalletConnectButton from "@components/WalletConnectButton";
import SolNetStats from "@components/SolNetStats";
import FooterLink from "@components/FooterLink";
import { useNavigate } from "react-router-dom";
import LeaderboardDropdown from "@components/LeaderboardDropdown";

const LeaderboardLayout = ({ children }: PropsWithChildren) => {
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
                <LeaderboardDropdown />
            </div>
            {children}
        </section>
    );
};

export const withLeaderboardLayout =
    <P extends object>(Component: ComponentType<P>) =>
    (Props: P) => (
        <LeaderboardLayout>
            <Component {...Props} />
        </LeaderboardLayout>
    );
