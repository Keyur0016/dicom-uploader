import { Button, Flex, Menu, Dropdown } from "antd";
import React, { useState } from "react";
import { BackwardFilled, SettingOutlined } from "@ant-design/icons";
import { UploadOutlined } from "@ant-design/icons";
import { LogoutOutlined } from "@ant-design/icons";
import SettingComp from "./settingComp";
import { useNavigate } from "react-router-dom";

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
    const navigation = useNavigate() ;

    return(
        <Flex className="header-div" gap={10}>

            <Button style={{
                marginTop: "auto", 
                marginBottom: "auto"
            }}
                type="primary"
                icon = {<BackwardFilled/>}
            >
            </Button>

            <Button icon = {<SettingOutlined/>} style={{
                marginTop: 'auto', 
                marginBottom: "auto"
            }} onClick={() => {
                setIsSettingModalOpen(true)
            }}>
                Settings
            </Button>  

            {window.location.pathname !== "/studyupload" && (
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