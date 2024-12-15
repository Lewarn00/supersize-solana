import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
    const navigate = useNavigate();

    const handleClickHome = useCallback(() => {
        navigate("/");
    }, []);

    return (
        <div className="min-h-screen flex flex-grow items-center justify-center bg-black">
            <div className="rounded-lg bg-black p-8 text-center shadow-xl">
                <h1 className="mb-4 text-4xl text-white font-bold">404</h1>
                <p className="text-gray-600 text-white">
                    Oops! The page you are looking for could not be found.
                </p>
                <button
                    className="mt-4 inline-block rounded bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600"
                    onClick={handleClickHome}
                >
                    {" "}
                    Go back to Games{" "}
                </button>
            </div>
        </div>
    );
};

export default NotFound;
