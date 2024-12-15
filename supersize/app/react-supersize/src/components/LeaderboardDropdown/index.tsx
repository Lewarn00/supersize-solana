import useSupersize from "@hooks/useSupersize";
import { useEffect, useRef, useState } from "react";

const LeaderboardDropdown = () => {
    const network = "devnet"; //"mainnet";
    const [toggle, setToggle] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const tokens = [
        {
            network: "devnet",
            token: "AsoX43Q5Y87RPRGFkkYUvu8CSksD9JXNEqWVGVsr8UEp",
        },
        {
            network: "mainnet",
            token: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        },
    ];
    const { leaderBoardOptions, setSeason, season } = useSupersize();

    useEffect(() => {
        const loadTokenMetadata = async () => {
            try {
                const matchedTokens = tokens.filter(
                    (token) => token.network === network,
                );

                const promises = matchedTokens.map(async (token) => {
                    const metadata = await fetchTokenMetadata(
                        token.token,
                        network,
                    );
                    return {
                        icon: metadata.image,
                        name: metadata.name,
                    };
                });

                const optionsData = await Promise.all(promises);

                leaderBoardOptions.current = optionsData;
                setSeason(leaderBoardOptions.current[0]);
                console.log("Updated options:", leaderBoardOptions.current);
            } catch (error) {
                console.error("Error loading token metadata:", error);
            }
        };

        loadTokenMetadata();
    }, [network]);

    const fetchTokenMetadata = async (
        tokenAddress: string,
        network: string,
    ): Promise<{ name: string; image: string }> => {
        try {
            const rpcEndpoint = `https://${network}.helius-rpc.com/?api-key=07a045b7-c535-4d6f-852b-e7290408c937`;

            const response = await fetch(rpcEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: 1,
                    method: "getAsset",
                    params: [tokenAddress],
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Error fetching asset:", errorText);
                throw new Error(
                    `HTTP Error: ${response.status} ${response.statusText}`,
                );
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error.message);
            }

            const content = data.result?.content;
            if (!content) {
                throw new Error("Content not found in response");
            }

            const jsonUri = content.json_uri;
            if (jsonUri) {
                const metadataResponse = await fetch(jsonUri);
                if (!metadataResponse.ok) {
                    const errorText = await metadataResponse.text();
                    console.error(
                        "Error fetching metadata from json_uri:",
                        errorText,
                    );
                    throw new Error(
                        `HTTP Error: ${metadataResponse.status} ${metadataResponse.statusText}`,
                    );
                }
                const metadataJson = await metadataResponse.json();
                return {
                    name: metadataJson.name || "Unknown",
                    image: metadataJson.image || "",
                };
            }

            const name = content.metadata?.symbol || "Unknown";
            const image = content.links?.image || content.files?.[0]?.uri || "";

            if (!image) {
                throw new Error("Image URI not found");
            }

            return { name, image };
        } catch (error) {
            console.error("Error fetching token metadata:", error);
            throw error;
        }
    };

    return (
        <div
            className="relative inline-block cursor-pointer font-['Terminus'] select-none mt-[3vh] mx-[2vw] w-fit"
            onClick={() => {
                setToggle(!toggle);
                if (leaderBoardOptions.current.length > 1) {
                    setIsDropdownOpen((prev: boolean) => !prev);
                }
            }}
        >
            <div
                className={`p-2 w-fit bg-black text-white border border-gray-300 rounded-lg text-center flex whitespace-nowrap items-center ${isDropdownOpen ? "rounded-bl-none rounded-br-none" : ""}`}
            >
                <img
                    src={season.icon}
                    alt={season.name}
                    className="w-[24px] h-[24px] mr-2"
                />
                {season.name}
            </div>

            {isDropdownOpen && (
                <div className="absolute top-full left-0 bg-black border border-gray-300 border-t-0 rounded-b-lg w-[120px] shadow-lg z-10">
                    {leaderBoardOptions.current
                        .filter((option) => option.name !== season.name)
                        .map((option) => (
                            <div
                                key={option.name}
                                className="w-[120px] p-2 text-white text-left flex items-center hover:opacity-50"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSeason({
                                        icon: option.icon,
                                        name: option.name,
                                    });
                                }}
                            >
                                <img
                                    src={option.icon}
                                    alt={option.name}
                                    className="w-[24px] h-[24px] mr-2"
                                />
                                <span className="opacity-50">
                                    {" "}
                                    {option.name}{" "}
                                </span>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};

export default LeaderboardDropdown;
