import React, { useEffect, useState, useContext } from "react";
import { Modal, Input, Form, Button, message, Spin } from "antd";
import showNotification from "../handler/notification.handler";
import { FILE_OPERATION_CONSTANT } from "../constant/constant";
import { restartOrthancServerRequest } from "../handler/study.handler";
import { useQuery } from "@tanstack/react-query";
import { GlobalContext } from "../context/globalContext";
import { configureOrthancPeerRequest } from "../handler/study.handler";
import { useMutation } from "@tanstack/react-query";

const SettingComp = ({ visible, onClose, onSave }) => {
    const [form] = Form.useForm();

    // Configure new orthanc peer request =========================================
    const { mutate: configuredPeer, isPending} = useMutation({
        mutationKey: ["configured", "orthanc", "peer"], 
        mutationFn: async (data) => {
            try {
                const response = await configureOrthancPeerRequest({
                    orthanc_peer: data.orthanc_peer, 
                    orthanc_url: data.orthanc_url, 
                    orthanc_username: data.orthanc_username, 
                    orthanc_password: data.orthanc_password
                });
                
                if (response?.status == 200){
                    showNotification("success", "Settings Configuration", "Uploader settings configured successfully")
                    onClose() ; 
                    return true ;
                }
                
            } catch (error) {
            }
        }, 
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        onError: (error) => {}
    });
    // Restart orthanc server request ==============================================
    const { refetch: updateOrthancServer, isLoading } = useQuery({
        queryKey: ["orthanc", "server-restart"],  // Fixed typo: "sever" to "server"
        queryFn: async () => {
            const response = await restartOrthancServerRequest();
            if (response.status === 200){
                let orthanc_peer_data = localStorage.getItem("orthanc-peer-data") ; 
                if (orthanc_peer_data){
                    orthanc_peer_data = JSON.parse(orthanc_peer_data) ; 
                    let configured_peer_response = await configuredPeer({
                        orthanc_peer: orthanc_peer_data?.orthanc_peer, 
                        orthanc_username: orthanc_peer_data?.orthanc_username, 
                        orthanc_password: orthanc_peer_data?.orthanc_password, 
                        orthanc_url : orthanc_peer_data?.orthanc_url
                    })
                }
                return response;
            }   else {

            }
        },
        enabled: false,  // Add this to prevent automatic execution on component mount
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        retry: 3,
    });

    // Save related option handler ===================================
    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            
            // Remove any existing listeners first
            // window.electronAPI.removeAllListeners('saveSuccess');
            // window.electronAPI.removeAllListeners('saveFailed');

            // Set up one-time event listeners
            window.electronAPI.saveSuccess(async (event, message) => {
                if (message === FILE_OPERATION_CONSTANT.DICOM_SETTING_FILE_SAVED) {
                    await updateOrthancServer();
                }
            });

            window.electronAPI.saveFailed((event, message) => {
                showNotification("error", "Uploader Settings", "Failed to save uploader setting related information");
            });

            // Trigger the save operation
            window.electronAPI.saveDicomSetting({
                "setting": values
            });

        } catch (errorInfo) {
            console.error("Validation Failed:", errorInfo);
        }
    };

    // Fetch setting related information =============================
    const fetchDicomSettings = async () => {
        try {
            let settings = await window.electronAPI.readSettingInfo() ;
            form.setFieldsValue({
                ...settings.setting
            })
            
        } catch (error) {
            
        }
    }

    useEffect(() => {
        if (visible){
            fetchDicomSettings() ; 
        }
    },[visible]) ; 

    return (
        <Modal
            title="DICOM Settings"
            open={visible}
            onCancel={onClose}
            className="dicom-uploader-modal"
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Cancel
                </Button>,
                <Button key="save" type="primary" onClick={handleSave}
                    loading = {isLoading || isPending}
                >
                    Save
                </Button>,
            ]}
        >

            <Spin spinning = {isLoading || isPending}>
                <Form form={form} layout="vertical">
                    <Form.Item 
                        label="IP Address" name="ipAddress" 
                        rules={[{ required: true, message: "Please enter IP Address" }]}>
                        <Input placeholder="Enter IP Address" />
                    </Form.Item>
                    <Form.Item label="DICOM AET" name="dicomAET" rules={[{ required: true, message: "Please enter DICOM AET" }]}>
                        <Input placeholder="Enter DICOM AET" />
                    </Form.Item>
                    <Form.Item label="PORT" name="port" rules={[{ required: true, message: "Please enter PORT" }]}>
                        <Input placeholder="Enter PORT" />
                    </Form.Item>
                    <Form.Item label="Folder Location" name="folderLocation" rules={[{ required: true, message: "Please enter Folder Location" }]}>
                        <Input placeholder="Enter Folder Location" />
                    </Form.Item>
                </Form>
            </Spin>
        </Modal>
    );
};

export default SettingComp ; 