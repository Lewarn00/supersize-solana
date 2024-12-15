import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

const FooterLink = () => {
    const [gitbookHovered, setGitBookHovered] = useState(false);
    const [xHovered, setXHovered] = useState(false);
    const [tgHovered, setTgHovered] = useState(false);
    const [buildHovered, setBuildHovered] = useState(false);

    const navigate = useNavigate();

    const openDocs = useCallback(() => {
        window.open("https://docs.supersize.gg/", "_blank");
    }, []);
    const openX = useCallback(() => {
        window.open("https://x.com/SUPERSIZEgg", "_blank");
    }, []);
    const openTG = useCallback(() => {
        window.open("https://t.me/supersizeplayers", "_blank");
    }, []);

    return (
        <div className="ml-auto flex bg-black mr-[2vw] text-white border border-[#FFFFFF4D] font-[Terminus] h-[40px] w-[300px]">
            <div
                className="w-[35px] h-[40px] flex cursor-pointer items-center justify-center border-r border-[#FFFFFF4D] px-[3px]"
                onMouseEnter={() =>
                    setBuildHovered(true)
                }
                onMouseLeave={() =>
                    setBuildHovered(false)
                }
                onClick={() => { navigate('/create-game')}}
            >
                <img
                    src={`${process.env.PUBLIC_URL}/build2.png`}
                    alt="Image"
                    className={` w-[20px] h-auto absolute ${buildHovered ? "opacity-20" : "opacity-80"} transition-opacity duration-300 ease-in-out`}
                />
                {buildHovered && (
                    <img
                        src={`${process.env.PUBLIC_URL}/buildhighlight2.png`}
                        alt="Highlighted Image"
                        className={`w-[20px] h-auto absolute ${buildHovered ? "opacity-80" : "opacity-20"} transition-opacity duration-300 ease-in-out`}
                    />
                )}
            </div>
            
            <div
                className="w-[35px] h-[40px] flex cursor-pointer items-center justify-center border-r border-[#FFFFFF4D] px-[3px]"
                onMouseEnter={() => setGitBookHovered(true)}
                onMouseLeave={() => setGitBookHovered(false)}
                onClick={openDocs}
            >
                <img
                    src={`${process.env.PUBLIC_URL}/GitBook.png`}
                    alt="Image"
                    className={` w-[20px] h-auto absolute ${gitbookHovered ? "opacity-20" : "opacity-80"} transition-opacity duration-300 ease-in-out`}
                />
                {gitbookHovered && (
                    <img
                        src={`${process.env.PUBLIC_URL}/GitBookhighlight.png`}
                        alt="Highlighted Image"
                        className={`w-[20px] h-auto absolute ${gitbookHovered ? "opacity-80" : "opacity-20"} transition-opacity duration-300 ease-in-out`}
                    />
                )}
            </div>

            <div
                className="w-[35px] h-[40px] flex cursor-pointer items-center justify-center border-r border-[#FFFFFF4D] px-[3px]"
                onMouseEnter={() => setXHovered(true)}
                onMouseLeave={() => setXHovered(false)}
                onClick={openX}
            >
                <img
                    src={`${process.env.PUBLIC_URL}/x-logo.png`}
                    alt="Image"
                    className={` w-[20px] h-auto absolute ${xHovered ? "opacity-20" : "opacity-80"} transition-opacity duration-300 ease-in-out`}
                />
                {xHovered && (
                    <img
                        src={`${process.env.PUBLIC_URL}/x-logo-highlight.png`}
                        alt="Highlighted Image"
                        className={`w-[20px] h-auto absolute ${xHovered ? "opacity-80" : "opacity-20"} transition-opacity duration-300 ease-in-out`}
                    />
                )}
            </div>

            <div
                className="w-[35px] h-[40px] flex cursor-pointer items-center justify-center border-r border-[#FFFFFF4D] px-[3px]"
                onMouseEnter={() => setTgHovered(true)}
                onMouseLeave={() => setTgHovered(false)}
                onClick={openTG}
            >
                <img
                    src={`${process.env.PUBLIC_URL}/tg2.png`}
                    alt="Image"
                    className={` w-[20px] h-auto absolute ${tgHovered ? "opacity-20" : "opacity-80"} transition-opacity duration-300 ease-in-out`}
                />
                {tgHovered && (
                    <img
                        src={`${process.env.PUBLIC_URL}/tg.png`}
                        alt="Highlighted Image"
                        className={`w-[20px] h-auto absolute ${tgHovered ? "opacity-80" : "opacity-20"} transition-opacity duration-300 ease-in-out`}
                    />
                )}
            </div>

            <div className="text-base flex items-center m-2.5">
                © Supersize Inc. 2024
            </div>
        </div>
    );
};

export default FooterLink;
