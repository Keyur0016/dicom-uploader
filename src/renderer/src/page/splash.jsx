import { Flex, Spin } from "antd";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES_LIST } from "../constant/route.constant";
import { FILE_OPERATION_CONSTANT } from "../constant/constant";
import showNotification from "../handler/notification.handler";
import { useQuery } from "@tanstack/react-query";
import { userInformationRequest } from "../handler/user.handler";
import { GlobalContext } from "../context/globalContext";

const Splash = () => {

    const [loading, setLoading] = useState(false); 
    const navigation = useNavigate(); 

    // User information fetch =============================================
    const {refetch: userInformaitonFetch} = useQuery({
        queryKey: ["user", "information", "fetch"],
        queryFn: async () => {
            setLoading(true);
            const response = await userInformationRequest({
                payload: {}, 
                params: {
                    is_details: true
                }
            }); 
            if (response?.status){
                localStorage.setItem("orthanc-peer-data", JSON.stringify(response?.data)) ; 
                navigation(ROUTES_LIST.STUDYLIST_ROUTE) ; 
            }   else {
                navigation(ROUTES_LIST.LOGIN_ROUTE); 
            }
            setLoading(false);
        }, 
        enabled: false
    })

    // Fetch user information request ========================================================
    const fetchUserData = async () => {
        try {
            let content = await window.electronAPI.readTokenInfo() ; 
            if (!content){
                navigation(ROUTES_LIST.LOGIN_ROUTE) ; 
            }   else {
                content = JSON.parse(content) ; 
                localStorage.setItem('token', content?.token?.accessToken) ; 
                await userInformaitonFetch() ; 
                // navigation(ROUTES_LIST.STUDYLIST_ROUTE) ; 
            }
        } catch (error) {
            navigation(ROUTES_LIST.LOGIN_ROUTE) ; 
        }
    }

    // Move orthanc server related folder ====================================================
    const moveOrthancFolder = async () => {
        try {
            await window.electronAPI.moveOrthancFolder() ;
            window.electronAPI.moveOrthanceResponse((event, message) => {
                if (message == FILE_OPERATION_CONSTANT.ORATANCE_SERVER_FOLDER_COPY_FAILED){
                    showNotification("error", "Orthanc Configuration", "Failed to configure Orthanc server")
                }
            })
        } catch (error) {
            // showNotification("erorr", "Orthanc Configuration", String(error)) ; 
        }
    }

    // Orthanc exe background related configuration ==========================================
    const orthancExeBackgroundConfiguration = async () => {
        try {
            await window.electronAPI.orthanceExeHandler() ; 
            window.electronAPI.orthanceExeReply((event, message) => {
                if (message == FILE_OPERATION_CONSTANT.ORTHANCE_EXE_FAILED){
                    showNotification("error", "Orthanc Configuration", "Failed to configure Orthanc server")
                }
            })
        } catch (error) {
            // showNotification("error", "Orthanc Configuration", "Failed to configure Orthanc server")
        }
    }

    useEffect(() => {
        moveOrthancFolder() ; 
        orthancExeBackgroundConfiguration() ; 
        fetchUserData() ; 
    },[])

    return (
        <Spin spinning = {loading}>
            <Flex className="splash-div">
                <div style={{
                    margin: "auto"
                }}>

                    {/* Upload image */}
                    <Flex>
                        <img
                            className="upload-image"
                            src="https://res.cloudinary.com/dryhptx96/image/upload/v1715699852/cloudimts_evortl.jpg"
                        />
                    </Flex>

                    {/* Uploader name  */}
                    <div className="uploader-name">
                        Cloudimts Uploader
                    </div>

                    {/* Uploader version  */}
                    <div className="uploader-version">
                        v1.0.0
                    </div>

                </div>
            </Flex>
        </Spin>
    )
}

export default Splash; 