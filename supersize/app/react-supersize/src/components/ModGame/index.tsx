const ModGame = () => {
    return (
        <div className="flex w-full h-full text-white flex-col">
            <h1 className="m-[2vw] font-conthrax text-[35px]">Mod Your Game</h1>
            <p className="ml-[2vw] font-terminus text-[24px] w-[80%]">
                Make your game stand out. Add everything from custom features
                and gameplay mechanics to in-game drops. Supersize is a
                real-time fully onchain game powered by Magicblock engine.
                <br />
                <br />
            </p>
            <div className="flex flex-col ml-[2vw] mt-[1vw]">
                <div className="flex flex-row items-center text-white">
                    <img
                        className="mt-[1vw] w-[30px] h-auto"
                        src={`${process.env.PUBLIC_URL}/Logomark_white.png`}
                        alt="Image"
                    />{" "}
                    <a
                        className="mt-5 ml-4 cursor-pointer"
                        onClick={() => {
                            window.open(
                                "https://docs.magicblock.gg/Forever%20Games",
                                "_blank",
                            );
                        }}
                    >
                        {" "}
                        docs.magicblock.gg{" "}
                    </a>
                </div>
                <div className="flex flex-row items-center text-white">
                    <img
                        className="mt-[1vw] w-[30px] h-auto"
                        src={`${process.env.PUBLIC_URL}/GitBook.png`}
                        alt="Image"
                    />{" "}
                    <a
                        className="mt-2 ml-4 cursor-pointer"
                        onClick={() => {
                            window.open("https://docs.supersize.gg", "_blank");
                        }}
                    >
                        {" "}
                        docs.supersize.gg
                    </a>
                </div>
                <div className="flex flex-row items-center text-white">
                    <img
                        className="mt-[1vw] w-[30px] h-auto"
                        src={`${process.env.PUBLIC_URL}/github-mark-white.png`}
                        alt="Image"
                    />{" "}
                    <a
                        className="mt-2 ml-4 cursor-pointer"
                        onClick={() => {
                            window.open(
                                "https://github.com/Lewarn00/supersize-solana/",
                                "_blank",
                            );
                        }}
                    >
                        {" "}
                        github.com/supersize-solana{" "}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ModGame;
