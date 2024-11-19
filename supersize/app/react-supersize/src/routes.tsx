import React from "react";
import { Route, Routes } from 'react-router-dom';
import Supersize from "./pages/Supersize";
import NotFound from "./pages/NotFound";

const AppRoutes = () => {
    return (
        <Routes>
            <Route index element = {<Supersize />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}

export default AppRoutes;