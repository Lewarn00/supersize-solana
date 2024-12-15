import React, { useEffect, useState } from "react";

type AlertProps = {
    type: "success" | "error";
    message: string;
    onClose: () => void;
};

const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
    const [opacity, setOpacity] = useState(0); // Start with 0 opacity for fade-in effect

    useEffect(() => {
        setOpacity(100);

        const fadeOutTimer = setTimeout(() => {
            setOpacity(0);
        }, 3000);

        const removeTimer = setTimeout(() => {
            onClose();
        }, 3500);

        return () => {
            clearTimeout(fadeOutTimer);
            clearTimeout(removeTimer);
        };
    }, [onClose]);

    return (
        <div
            className={`fixed bottom-5 left-1/2 transform -translate-x-1/2 
            p-5 mb-2.5 rounded-lg text-center text-sm 
            transition-opacity duration-1000 ease-in-out 
            flex justify-center items-center max-w-[90%] 
            break-words min-h-[50px] box-border z-[1000]
            opacity-${opacity} ${type == "success" ? "bg-lightgreen text-green" : "bg-pink text-red"}
            `}
        >
            {message}
        </div>
    );
};

export default Alert;
