import { Button, Flex, Menu, Dropdown, Popconfirm } from "antd";
import React, { useEffect, useState } from "react";
import { BackwardFilled, ReloadOutlined, SettingOutlined } from "@ant-design/icons";
import { UploadOutlined } from "@ant-design/icons";
import { LogoutOutlined } from "@ant-design/icons";
import SettingComp from "./settingComp";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES_LIST } from "../constant/route.constant";
import { HistoryOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import { userLoginRequest } from "../handler/user.handler";
import showNotification from "../handler/notification.handler";
import { getuserLogoutRequest } from "../handler/user.handler";

const Header = ({isUpload}) => {

    const [isSettingModalOpen, setIsSettingModalOpen] = useState(false) ; 
    const [userInformation, setUserInformation] = useState(undefined) ; 
    const navigation = useNavigate() ;
    const windowLocation = useLocation() ; 

    useEffect(() => {
        let userData = localStorage.getItem("orthanc-peer-data") ; 
        if (userData){
            setUserInformation(JSON.parse(userData)) ; 
        }
    }, []) ; 

    // User loogut request
    const {mutateAsync: userLogoutRequest, isPending } = useMutation({
        mutationKey: ["user", "logout", "request"],
        mutationFn: async () => {
            let response = await getuserLogoutRequest({}) ; 
            return response ; 
        }
    })

    const LogoutOptionHandler = async () => {
        
        // Store empty json object when user click on loogut 
        window.electronAPI.saveTokenInfo({}) ; 
        localStorage.removeItem("token") ;

        await userLogoutRequest() ; 
        showNotification("success", "Logout", "You have successfully logged out from the uploader")

        navigation(ROUTES_LIST.LOGIN_ROUTE) ; 

    }

    const items = [
        {
            key: "1",
            label: (
                <Button
                    icon =  {<LogoutOutlined/>}
                    danger
                    onClick={() => {LogoutOptionHandler()}}
                    loading = {isPending}
                >
                    Logout
                </Button>
            ),
        },
    ];

    return(
        <Flex className="header-div" gap={10}>

            {windowLocation.pathname !== ROUTES_LIST.STUDYLIST_ROUTE && (
                <Button style={{
                    marginTop: "auto", 
                    marginBottom: "auto"
                }}
                    type="primary"
                    icon = {<BackwardFilled/>}
                    onClick={() => {navigation(-1)}}
                >
                </Button>
            )}

            <Button icon = {<SettingOutlined/>} style={{
                marginTop: 'auto', 
                marginBottom: "auto"
            }} onClick={() => {
                setIsSettingModalOpen(true)
            }}>
                Settings
            </Button>  

            {windowLocation.pathname !== ROUTES_LIST.STUDYUPLOAD_ROUTE && (
                <Button icon = {<UploadOutlined/>} style={{
                    marginTop: "auto", 
                    marginBottom: "auto"
                }} onClick={() => {
                    navigation(ROUTES_LIST.STUDYUPLOAD_ROUTE)
                }}>
                    Upload
                </Button>
            )}

            {windowLocation.pathname !== ROUTES_LIST.STUDYUPLOAD_HISTORY_ROUTE && (
                <div className="upload-history-button"
                    onClick={() => {
                        navigation(ROUTES_LIST.STUDYUPLOAD_HISTORY_ROUTE)
                    }}
                >
                    <HistoryOutlined/>
                </div>
            )}

            {/* User profile related information  */}
            <div style={{marginLeft: "auto", marginTop: "auto"}}>
                <Flex gap={10}>

                    {/* User related information  */}
                    <Flex style={{
                        marginTop: "auto", 
                        marginBottom: "auto", 
                        fontSize: 14, 
                        color: "#FFF", 
                        cursor: "pointer"
                    }}>
                        <div className="uploader-username">
                            {userInformation?.username}
                        </div>
                        <div style={{
                            fontWeight: 600, 
                            marginLeft: 4,
                            marginRight: 4
                        }}>|</div>
                        <div>
                            <span style={{
                                fontWeight: 600
                            }}>Role :</span> {userInformation?.role || "---"}
                        </div>
                    </Flex>
                        
                    <Dropdown
                        menu={{
                            items: items, 
                        }}
                        placement="bottomLeft"
                    >
                        <img 
                            src="https://cdn-icons-png.flaticon.com/128/3177/3177440.png"
                            className="profile-image"
                        />
                    </Dropdown>

                </Flex>
            </div>


            <SettingComp
                visible={isSettingModalOpen}
                onClose={() => {
                    console.log("Close functionality");
                    
                    setIsSettingModalOpen(false)
                }}
                onSave={() => {

                }}
            />

        </Flex>
    )
}

export default Header