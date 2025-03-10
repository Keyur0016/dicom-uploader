import { Flex, Spin } from "antd";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES_LIST } from "../constant/route.constant";

const Splash = () => {

    const [loading, setLoading] = useState(false) ; 
    const navigation = useNavigate() ; 

    // Fetch User information Request ============================
    const fetchUserData = async () => {
        try {
            let content = await window.electronAPI.readTokenInfo() ; 
            if (!content){
                navigation(ROUTES_LIST.LOGIN_ROUTE) ; 
            }   else {
                navigation(ROUTES_LIST.STUDYLIST_ROUTE) ; 
            }
        } catch (error) {
            navigation(ROUTES_LIST.LOGIN_ROUTE) ; 
        }
        
    }

    useEffect(() => {
        fetchUserData() ; 
    },[])

    // useEffect(() => {
    //     navigation("/login") ; 
    // }, []) ; 

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