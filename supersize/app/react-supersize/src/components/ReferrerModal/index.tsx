import useSupersize from "@hooks/useSupersize";
import { useWallet } from "@solana/wallet-adapter-react";
import Invite from "../buddyInvite";

type ReferrerModalProps = {
    handleCloseModal: () => void;
};
const ReferrerModal: React.FC<ReferrerModalProps> = ({
    handleCloseModal,
}) => {
    const {publicKey} = useWallet();

    const {referrerInput, setReferrerInput, setIsReferrerModalOpen, isReferrerModalOpen, referrer, username, setUsername, setInputUsername, } = useSupersize();

    /*const handleCancel = () => {
        setReferrerInput(""); 
        setIsReferrerModalOpen(false);
    }
    console.log(isReferrerModalOpen, username)*/

    return (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 pointer-events-auto transition-opacity duration-300 ease-in-out z-[99999]"
        >
            <div className="bg-black border border-[#272b30] text-white rounded-lg shadow-sm shadow-black/5 h-[310px] p-5 w-[400px]">
                <h1 className="mb-2.5 text-center font-conthrax text-2xl">Join early access, use a referral to get $1 free</h1>
                <div className="mb-[10px]">
                    <span className="font-[terminus] ml-[10px] mb-[10px]">Username:</span>
                    <input type="text" className="bg-black border border-[#272b30] rounded-sm text-white font-terminus h-[30px] pl-1 w-full mt-2.5" placeholder="Username" value={username} onChange={(e) => {setUsername(e.currentTarget.value);  setInputUsername(e.currentTarget.value);}}/>
                </div>
                <div>
                    <span className="font-[terminus] ml-[10px] mb-[10px]">Referrer:</span>
                    <span className="font-[terminus] ml-[10px] mb-[10px]">{referrer ? referrer : "none, better get one!"}</span>
                </div>
                <div className="flex justify-between m-[20px]">
                    <button className="w-[40%] bg-black border border-[#c4b5fd] rounded-md shadow-[0_0_10px_0] shadow-[#6d5887] text-white cursor-pointer font-terminus text-lg sm:text-xl px-4 py-2 transition-colors duration-250 ease-in-out hover:bg-black hover:border-[#755e92] hover:shadow-none" onClick={handleCloseModal}>Cancel</button>
                    <button className="w-[40%] bg-black border border-[#c4b5fd] rounded-md shadow-[0_0_10px_0] shadow-[#6d5887] text-white cursor-pointer font-terminus text-lg sm:text-xl px-4 py-2 transition-colors duration-250 ease-in-out hover:bg-black hover:border-[#755e92] hover:shadow-none" onClick={() => {}}><Invite/></button>
                </div>
            </div>
        </div>
    )
}

export default ReferrerModal;