const EarnFees = () => {
    return (
        <div className="flex justify-center w-full h-full text-white">
            <div className="mt-[2vw] w-[60%]">
                <h1 className="m-[2vw] ml-[4vw] font-[Conthrax] text-[36px]">
                    Earn Fees
                </h1>
                <p className="ml-[4vw] font-[terminus] text-[20px] w-[80%]">
                    Supersize will be playable using SPL tokens. The game owner
                    recieves a 1% fee charged on each player exit. Fees
                    accumulate in each game’s chosen SPL token.
                </p>
            </div>
            <img
                src={`${process.env.PUBLIC_URL}/Group7.png`}
                className="w-[25vw] h-[25vw] mr-[1vw] self-center"
                alt="Image"
            />
        </div>
    );
};

export default EarnFees;
