import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "./index.css";

const WalletConnectButton = () => {
    return (
        <div className="mt-5 mr-5 rounded-md wallet-buttons">
            <WalletMultiButton />
        </div>
    );
};

export default WalletConnectButton;
