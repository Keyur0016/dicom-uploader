import React from "react";
import Header from "../components/header";
import { QueryClient } from "@tanstack/react-query";
import { GlobalProvider } from "../context/globalContext";

const BaseLayout = ({element}) => {
    return(
            <div className="main-div">
                <Header/>
                    {element}
            </div>
    )
}

export default BaseLayout ; 