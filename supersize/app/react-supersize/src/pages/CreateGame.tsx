import { withGameLayout } from "@layouts/GameLayout";
import { useState } from "react";
import LanchGame from "@components/LaunchGame";
import EarnFees from "@components/EarnFees";
import ModGame from "@components/ModGame";

const CreateGame = () => {
    const tabs = [0, 1, 2];
    const [tab, setTab] = useState(0);

    return (
        <div className="flex flex-col h-[84vh] w-full justify-center items-center">
            <div className="h-[60vh] p-[2vw] w-[60vw] bg-black border border-[#272B30] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] rounded-[0.75rem]">
                {tab === 0 ? (
                    <LanchGame />
                ) : tab === 1 ? (
                    <EarnFees />
                ) : (
                    <ModGame />
                )}
            </div>
            <div className="flex items-center justify-center h-fit w-fit">
                {tabs.map((tabIdx) => {
                    return (
                        <div
                            key={tabIdx}
                            className={`${tabIdx == tab ? "w-[1vw] h-[1vw] bg-white border border-black rounded-full flex items-center justify-center transition-all duration-300 m-[1vw] cursor-pointer" : "w-[1vw] h-[1vw] bg-black border border-white rounded-full flex items-center justify-center transition-all duration-300 m-[1vw] cursor-pointer hover:border-black hover:bg-white"}`}
                            onClick={() => {
                                setTab(tabIdx);
                            }}
                        ></div>
                    );
                })}
            </div>
        </div>
    );
};

export default withGameLayout(CreateGame);
