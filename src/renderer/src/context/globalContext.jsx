import React, { createContext, useState } from "react";

// Create context
export const GlobalContext = createContext();

// Create a provider component
export const GlobalProvider = ({ children }) => { 
    const [studyList, setStudyList] = useState({});
    const [userInformation, setUserInformation] = useState({}) ; 

    return (
        <GlobalContext.Provider 
            value={{ 
                setStudyList, 
                studyList, 
                userInformation, 
                setUserInformation
            }}>
            {children} 
        </GlobalContext.Provider>
    );
};