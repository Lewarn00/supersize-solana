import useSupersize from "@hooks/useSupersize";
import React, { useState } from "react";

type gameProps = {
    game_size: number;
    userKey: string;
};

type FormData = [number, number, number, string, string, string];

const CreateGame: React.FC<gameProps> = ({ game_size, userKey }) => {
    const { newGameTx } = useSupersize();
    const [formData, setFormData] = useState<FormData>([
        game_size,
        10.0,
        0.1,
        userKey,
        "AsoX43Q5Y87RPRGFkkYUvu8CSksD9JXNEqWVGVsr8UEp",
        "ffa",
    ]);

    const handleChange =
        (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
            const { type, checked, value } = e.target;
            const updatedFormData = [...formData] as FormData;
            if (index > 2) {
                updatedFormData[index] = value as string;
            } else {
                updatedFormData[index] = parseFloat(value) as number;
            }
            setFormData(updatedFormData);
        };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("Form Data Submitted:", formData);
    };

    return (
        <form
            className="flex flex-col h-fit w-[21vw] gap-2.5 p-5 border border-[#272B30] rounded-[10px] text-white bg-black shadow-[rgba(0,0,0,0.05)_0px_1px_2px_0px] font-[Terminus]"
            onSubmit={handleSubmit}
        >
            <h2 className="mb-[0.2vw]">Game Settings</h2>
            <label>
                <span className="mb-[5px] ml-[10px]">Name</span>
                <input
                    type="text"
                    className="border border-[#272B30] rounded-[5px] w-full h-[30px] bg-black text-white pl-1 font-[Terminus]"
                    name="game_name"
                    value={String(formData[5])}
                    onChange={handleChange(5)}
                />
            </label>
            <label>
                <span className="mb-[5px] ml-[10px]">Max Buy-In</span>
                <input
                    className="no-arrows border border-[#272B30] rounded-[5px] w-full h-[30px] bg-black text-white pl-1 font-[Terminus]"
                    type="number"
                    name="buy_in_min"
                    value={String(formData[1])}
                    onChange={handleChange(1)}
                />
            </label>
            <label>
                <span className="mb-[5px] ml-[10px]">Min Buy-In</span>
                <input
                    className="no-arrows border border-[#272B30] rounded-[5px] w-full h-[30px] bg-black text-white pl-1 font-[Terminus]"
                    type="number"
                    name="buy_in_max"
                    value={String(formData[2])}
                    onChange={handleChange(2)}
                />
            </label>
            <label>
                <span className="mb-[5px] ml-[10px]">Token (mint address)</span>
                <input
                    className="no-arrows border border-[#272B30] rounded-[5px] w-full h-[30px] bg-black text-white pl-1 font-[Terminus]"
                    type="text"
                    name="game_token"
                    value={String(formData[4])}
                    onChange={handleChange(4)}
                />
            </label>
            <label style={{ marginBottom: "5px" }}>
                <span className="mb-[5px] ml-[10px]">
                    Game Owner (wallet address)
                </span>
                <input
                    className="no-arrows border border-[#272B30] rounded-[5px] w-full h-[30px] bg-black text-white pl-1 font-[Terminus]"
                    type="text"
                    name="game_owner"
                    value={String(formData[3])}
                    onChange={handleChange(3)}
                />
            </label>
            <button
                onClick={() => {
                    newGameTx(...formData);
                }}
                className="px-4 py-2 text-[20px] font-[Terminus] rounded-[10px] cursor-pointer bg-[#000] text-white border-[1px] border-[#C4B5FD] shadow-[rgb(109,88,135)_0px_0px_10px_0px] transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-[#000] hover:border-[#755E92] hover:shadow-none"
            >
                Create Game
            </button>
        </form>
    );
};

export default CreateGame;
