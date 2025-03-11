import React from "react";
import StudyInfoComponent from "../components/studyInfoComponent";
import { useQuery } from "@tanstack/react-query";
import { fetchStudyList } from "../handler/study.handler";
import Header from "../components/header";
import { Empty } from "antd";

const StudyList = () => {
    
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
    
    return(
        <div className="main-div">
            <div className="study-list-div">
                {studies?.map((element) => {
                    return(
                        <StudyInfoComponent
                            studyid={element}
                        />
                    )
                })}
                {studies && studies?.length == 0 && (
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