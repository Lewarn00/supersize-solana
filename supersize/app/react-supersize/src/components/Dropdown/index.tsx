import React, { useEffect, useState } from "react";
import { endpoints, options } from "@utils/constants";
import { pingEndpoint } from "@utils/helper";
import { useSupersizeContext } from "@contexts/SupersizeContext";

const Dropdown = () => {
    const {
        selectedOption,
        handleOptionClick,
    } = useSupersizeContext();

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const handleClick = (option: string) => {
        setIsDropdownOpen(false);
        handleOptionClick(option);
    }

    return (
        <div
            className="relative inline-block cursor-pointer font-['Terminus'] select-none mt-4 ml-2 w-[120px]"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
        >
            <div
                className={`px-2.5 py-2 w-[120px] bg-black text-white border border-gray-300 rounded-[10px] text-center ${isDropdownOpen ? "rounded-bl-none rounded-br-none" : ""}`}
            >
                <span className="inline-block w-[8px] h-[8px] rounded-full mr-2 opacity-100 bg-[#67F4B6]" />
                {selectedOption}
            </div>

            {isDropdownOpen && (
                <div className="absolute top-full left-0 bg-black border border-gray-300 border-t-0 rounded-b-[10px] w-[120px] shadow-lg z-10">
                    {options
                        .filter((option) => option !== selectedOption)
                        .map((option) => (
                            <div
                                key={option}
                                className="w-[120px] p-2.5 text-white text-left hover:opacity-50"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClick(option);
                                }}
                            >
                                <span className="inline-block w-[8px] h-[8px] rounded-full mr-2 opacity-100 bg-[#FF8888]" />
                                <span className="hover:opacity-50">
                                    {" "}
                                    {option}{" "}
                                </span>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};

export default Dropdown;
