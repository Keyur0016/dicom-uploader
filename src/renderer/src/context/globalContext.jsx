import React, { createContext, useState } from "react";

// Create context
export const GlobalContext = createContext();

// Create a provider component
export const GlobalProvider = ({ children }) => { 
    const [studyList, setStudyList] = useState({});

    return (
        <GlobalContext.Provider value={{ setStudyList, studyList }}>
            {children} 
        </GlobalContext.Provider>
    );
};