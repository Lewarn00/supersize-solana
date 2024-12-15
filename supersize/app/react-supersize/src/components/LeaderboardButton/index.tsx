import { useState } from "react";

type LeaderboardButtonProps = {
    handleLeaderboadClick: () => void;
};
const LeaderboardButton: React.FC<LeaderboardButtonProps> = ({
    handleLeaderboadClick,
}) => {
    const [leaderBoardActive, setLeaderboardActive] = useState(false);
    return (
        <>
            {leaderBoardActive ? (
                <img
                    src="/leaderboardhighlight.png"
                    alt="leaderboard"
                    className="w-[6vh] h-[6vh] mt-[2vh] cursor-pointer mr-4"
                    onMouseLeave={() => setLeaderboardActive(false)}
                    onClick={handleLeaderboadClick}
                />
            ) : (
                <img
                    src="/leaderboard.png"
                    alt="leaderboard"
                    className="w-[6vh] h-[6vh] mt-[2vh] cursor-pointer mr-4"
                    onMouseEnter={() => setLeaderboardActive(true)}
                    onClick={handleLeaderboadClick}
                />
            )}
        </>
    );
};

export default LeaderboardButton;
