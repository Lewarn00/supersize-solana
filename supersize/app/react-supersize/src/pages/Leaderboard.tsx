import { withLeaderboardLayout } from "@layouts/LeaderboardLayout";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useWallet } from "@solana/wallet-adapter-react";
import useSupersize from "@hooks/useSupersize";

interface Player {
    name: string;
    total: number;
}
interface UserInfo {
    position: number;
    points: number;
}

interface Users {
    id: string;
    walletAddress: string;
    name: string;
    contestId: string;
    winning: {
        id: string;
        userWalletAddress: string;
        usdc: number;
        sol: number;
        agld: number;
    }
}

const Leaderboard: React.FC = () => {
    const network = "devnet"; //"mainnet"; 
    const [season, setSeason] = useState({
        icon: `${process.env.PUBLIC_URL}/token.png`,
        name: "LOADING"
    });
    const users= useRef<Player[]>([]);
    const usersLen = useRef(0);

    const [rank, setRank] = useState<number | null>(null);
    const { publicKey } = useWallet();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [homeHover, setHomeHover] = useState(false);

    const tokens = [{network: "devnet", token: "AsoX43Q5Y87RPRGFkkYUvu8CSksD9JXNEqWVGVsr8UEp"}, {network: "mainnet", token: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"}, {network: "mainnet", token: "7dnMwS2yE6NE1PX81B9Xpm7zUhFXmQABqUiHHzWXiEBn"}]
    //const options = [{ icon: "/usdc.png", name: "Magical Gem" }, { icon: "/usdc.png", name: "USDC" }, { icon: "/Solana_logo.png", name: "SOL" }];
    const options = useRef([{icon: `${process.env.PUBLIC_URL}/token.png`, name: "LOADING"}]);

    const [userInfo, setUserInfo] = useState<UserInfo>({
        position: 0,
        points: 0
    });
    const [toggle, setToggle] = useState(false);

    useEffect(() => {
        const loadTokenMetadata = async () => {
          try {
            const matchedTokens = tokens.filter(token => token.network === network);
            
            const promises = matchedTokens.map(async token => {
            if(token.token.toString() === "7dnMwS2yE6NE1PX81B9Xpm7zUhFXmQABqUiHHzWXiEBn"){
                return {
                    icon: `${process.env.PUBLIC_URL}/agld.jpg`,
                    name: "AGLD",
                };
            }else{
              const metadata = await fetchTokenMetadata(token.token, network);
            return {
                icon: metadata.image,
                name: metadata.name,
            };
            }
            });
      
            const optionsData = await Promise.all(promises);
      
            options.current = optionsData;
            setSeason(options.current[0]);
            console.log("Updated options:", options.current);
          } catch (error) {
            console.error("Error loading token metadata:", error);
          }
        };
      
        loadTokenMetadata();
      }, [network]);

    const fetchTokenMetadata = async (
        tokenAddress: string,
        network: string
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
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
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
              console.error("Error fetching metadata from json_uri:", errorText);
              throw new Error(`HTTP Error: ${metadataResponse.status} ${metadataResponse.statusText}`);
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

    useEffect(() => {
        if (!publicKey) {
            return;
        }
        if(options.current[0].name === "LOADING"){
            return;
        }
        (async () => {
            try {
                let res = await axios.get(`https://supersize.lewisarnsten.workers.dev/get-user-position?walletAddress=${publicKey.toString()}&contestName=${season.name}`);
                let contestantFound = true;
                // Check if the response indicates an error
                if (res.data?.error === 'User not found in contest') {
                    console.log("User not found, retrying with fallback walletAddress...");
                    res = await axios.get(`https://supersize.lewisarnsten.workers.dev/get-user-position?walletAddress=DdGB1EpmshJvCq48W1LvB1csrDnC4uataLnQbUVhp6XB&contestName=${season.name}`);
                    contestantFound = false;
                }
                
                if(contestantFound){
                    setUserInfo({
                        position: res.data.position,
                        points: res.data.points
                    });
                }else{
                    setUserInfo({
                        position: 0,
                        points: 0
                    });
                }
                console.log("topParticipants:::::", res.data.topParticipants, res.data.totalCandidates);
        
                const participants = res.data.topParticipants.map((participant: any) => (
                    { 
                        name: participant.walletAddress, 
                        total: participant.winAmount
                    }
                ));
                users.current = participants;
                usersLen.current = res.data.totalCandidates;
            } catch (error) {
                console.error("An error occurred during the request:", error);
            }
        })();
    }, [publicKey, season]);

    return (
        <div className="bg-black text-white mt-[1vh] px-[100px] h-screen flex flex-col font-['Terminus'] font-normal">
            <div className="relative mt-[60px]">
                <h2 className="absolute top-[-30px] left-[10px] text-[30px] bg-black p-2 text-[rgb(103,244,182)]">
                    MY RANKING
                </h2>
                <div className="border border-white p-6 mb-6">
                    <div className="flex gap-[32px]">
                        <div className="flex justify-center items-center w-[50%]">
                            <div className="text-center mb-4">
                                <div className="text-[25px] opacity-80 mb-1 text-gray-500">
                                    Global Ranking
                                </div>
                                <div className="text-[40px] text-[rgb(103,244,182)]">
                                    {userInfo.position}{" "}
                                    <span className="text-[16px] opacity-80 text-white">
                                        / {usersLen.current}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center items-center w-[50%]">
                            <div className="text-center mb-4">
                                <div className="text-[25px] opacity-80 mb-1 text-gray-500">
                                    Total Winnings
                                </div>
                                <div className="text-[40px] text-[rgb(103,244,182)]">
                                    {userInfo.points.toFixed(3)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden mt-5 flex flex-col">
                <table className="w-full border-collapse">
                    <thead className="w-full border-b border-gray-500 text-[24px] text-[rgb(103,244,182)]">
                        <tr>
                            <th className="text-left p-3 opacity-80">Rank</th>
                            <th className="text-left p-3 opacity-80">Player</th>
                            <th className="text-right p-3 opacity-80">Total</th>
                        </tr>
                    </thead>
                </table>
                <div className="overflow-y-auto flex-1">
                    <table className="w-full border-collapse">
                        <tbody>
                            {users.current.map((player, i) => (
                                <tr
                                    key={i}
                                    onMouseEnter={() => setRank(i)}
                                    onMouseLeave={() => setRank(null)}
                                    className={`bg-${rank === i ? "custom-green" : "transparent"}`}
                                >
                                    <td className="text-left p-3 text-[25px]">
                                        {i + 1}
                                    </td>
                                    <td className="text-left p-3 text-[25px]">
                                        <div className="flex mr-[-50px]">
                                            <span className="text-[25px]">
                                                {player.name}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="text-right p-3 text-[18px]">
                                        {player.total.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default withLeaderboardLayout(Leaderboard);
