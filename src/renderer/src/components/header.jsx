import { Button, Flex, Menu, Dropdown, Popconfirm } from "antd";
import React, { useEffect, useState } from "react";
import { BackwardFilled, ReloadOutlined, SettingOutlined } from "@ant-design/icons";
import { UploadOutlined } from "@ant-design/icons";
import { LogoutOutlined } from "@ant-design/icons";
import SettingComp from "./settingComp";
import { useNavigate } from "react-router-dom";
import { ROUTES_LIST } from "../constant/route.constant";

const items = [
    {
        key: "1",
        label: (
            <Button
                icon =  {<LogoutOutlined/>}
                danger
            >
                Logout
            </Button>
        ),
    },
];

const Header = ({isUpload}) => {

    const [isSettingModalOpen, setIsSettingModalOpen] = useState(false) ; 
    const [userInformation, setUserInformation] = useState(undefined) ; 
    const navigation = useNavigate() ;

    useEffect(() => {
        let userData = localStorage.getItem("orthanc-peer-data") ; 
        if (userData){
            console.log(userData);
            setUserInformation(JSON.parse(userData)) ; 
        }
    }, [])

    return(
        <Flex className="header-div" gap={10}>

            {window.location.pathname !== ROUTES_LIST.STUDYLIST_ROUTE && (
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

            {window.location.pathname !== ROUTES_LIST.STUDYUPLOAD_ROUTE && (
                <Button icon = {<UploadOutlined/>} style={{
                    marginTop: "auto", 
                    marginBottom: "auto"
                }} onClick={() => {
                    navigation("/studyupload")
                }}>
                    Upload
                </Button>
            )}

            {/* User profile related information  */}
            <div style={{marginLeft: "auto", marginTop: "auto"}}>
                <Flex gap={10}>
                    
                    {/* Reload application related option handler  */}
                    {/* <Popconfirm
                        title = {"Application Reload"}
                        description = {"Are you sure you want to reload uploader"}
                        onConfirm={() => {
                            ApplicationReloadHandler() ; 
                        }}
                    >
                        <Button 
                            icon = {<ReloadOutlined/>} 
                            style={{marginTop: "auto", marginBottom: "auto"}}
                        />
                    </Popconfirm> */}

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