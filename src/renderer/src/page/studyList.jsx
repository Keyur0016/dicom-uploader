import React, { useEffect, useState } from "react";
import StudyInfoComponent from "../components/studyInfoComponent";
import { useQuery } from "@tanstack/react-query";
import { fetchStudyList } from "../handler/study.handler";
import Header from "../components/header";
import { Empty } from "antd";

const StudyList = () => {

    const [userInformation, setUserInformation] = useState(undefined) ; 
    const [studyList, setStudyList] = useState([]) ; 
    
    // Fetch study list ==========================
    const {data: studies, isLoading} = useQuery({
        queryKey: ["get", "studies", "list"],
        queryFn: async () => {
            let response = await fetchStudyList() ; 
            return response ; 
        }, 
        refetchInterval: 1000, 
        refetchIntervalInBackground: true
    })

    useEffect(() => {
        if (studies?.length > studyList?.length){
            setStudyList(studies) ; 
        }
    }, [studies])

    // Set user information ==================
    useEffect(() => {
        let userData = localStorage.getItem("orthanc-peer-data") ; 
        if (userData){
            userData = JSON.parse(userData) ; 
            setUserInformation(userData)
        }
    },[])
    
    return(
        <div className="main-div">
            <div className="study-list-div">
                {studyList && studyList?.map((element) => {
                    return(
                        <StudyInfoComponent
                            studyid={element}
                            userInformation={userInformation}
                        />
                    )
                })}
                {studyList && studyList?.length == 0 && (
                    <div style={{
                        marginTop: "60px"
                    }}>
                        <Empty
                            description = "Not found any studies"
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

export default StudyList ; 