import React from "react";

type Props = {
    tps: number;
    price: number;
};

const SolNetStats: React.FC<Props> = ({ tps, price }) => {
    return (
        <div className="`h-[40px] flex items-center justify-center p-[10px] ml-[2vw] text-white font-[Terminus]">
            <div className="flex items-center justify-center p-[10px] border border-[#FFFFFF4D] border-r-0">
                TPS: {tps}
            </div>
            <div className="flex items-center justify-center p-[10px] border border-[#FFFFFF4D]">
                <img
                    src={`${process.env.PUBLIC_URL}/solana-logo.png`}
                    alt="Image"
                    className="w-[1vw] mr-[10px]"
                />
                ${Math.round(price)}
            </div>
        </div>
    );
};

export default SolNetStats;
