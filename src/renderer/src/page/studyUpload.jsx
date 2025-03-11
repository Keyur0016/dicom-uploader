import React, { useContext, useEffect, useState } from "react";
import Header from "../components/header";
import { InboxOutlined } from "@ant-design/icons";
import { Button, Flex, message, Spin, Upload } from "antd";
const { Dragger } = Upload
import { UploadOutlined } from "@ant-design/icons";
import { decryptData } from "../handler/decryption";
import { DeleteOutlined } from "@ant-design/icons";
import showNotification from "../handler/notification.handler";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from "../context/globalContext";

const StudyUpload = () => {

    const [fileList, setFileList] = useState([]) ;
    const [patientInformation, setPatientInformation] = useState(undefined) ; 
    const [imageUploading, setImageUploading] = useState(false) ; 
    const navigation = useNavigate() ; 

    // Drawer related props handler ========================
    const props = {
        name: 'file',
        multiple: true,
        action: 'https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload',
        onChange(info) {
            const { status } = info.file;
            // if (status !== 'uploading') {
            //     console.log(info.file, info.fileList);
            // }
            // if (status === 'done') {
            //     message.success(`${info.file.name} file uploaded successfully.`);
            // } else if (status === 'error') {
            //     message.error(`${info.file.name} file upload failed.`);
            // }
        },
        onDrop(e) {
            console.log('Dropped files', e.dataTransfer.files);
        },
    };

    // Study image clear option handler ======================================
    const StudyClearOptionHandler = () => {
        setFileList([]) ; 
        setPatientInformation(undefined) ; 
    }

    // Fetch dicom image related attributes information =======================
    const fetchPatientInformation = async () => {
        const formValue = new FormData() ; 
        formValue.append("file", fileList[0]?.originFileObj)
        let token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzUxODc4NjUzLCJpYXQiOjE3NDE1MTA2NTMsImp0aSI6IjMyMmE5ODU1NDJiZjRhNjFhYWU5ZGE2OWVlOGZiMmZhIiwidXNlcl9pZCI6MX0.SnepBPyO5kfLVYbODSR21Z7UqWsAcKRUKXis55H1jTA` ; 
        let BASE_URL = `https://backend.cloudimts.com/`
        let requestOptions = {
            method: "POST", 
            headers: {
                'Authorization': `Bearer ${token}`
            }, 
            body: formValue, 
            redirect: "follow"
        } ; 

        try {
            const response = await fetch(`${BASE_URL}image/v1/dicom_attr_fetch`, requestOptions) ; 
            let result = await response.json() ; 
            result = decryptData(result?.data) ; 
            setPatientInformation(JSON.parse(result))
        } catch (error) {
            
        }
    }

    useEffect(() => {
        if (fileList?.length > 0 && patientInformation == undefined){
            fetchPatientInformation();
        }
    }, [fileList]); 

    const UploadImageHandler = async () => {
        const ORTHANC_URL = "http://127.0.0.1:8042/";
    
        const uploadPromises = fileList.map(async (element) => {
            const formData = new FormData();
            formData.append("file", element?.originFileObj);
            try {
                const response = await fetch(`${ORTHANC_URL}instances/`, {
                    method: "POST",
                    body: formData,
                });
    
                if (!response.ok) {
                    throw new Error(`HTTP Error! Status: ${response.status}`);
                }
                return "success";
            } catch (error) {
                console.error("Upload Failed:", error);
                return "failure";
            }
        });
    
        // Wait for all uploads to finish
        const results = await Promise.all(uploadPromises);
    
        // Count success & failure
        const successCount = results.filter((res) => res === "success").length;
        const failureCount = results.filter((res) => res === "failure").length;
    
        if (successCount === fileList.length) {
            showNotification("success", 'Image Upload', "All Image uploaded successfully")
            setFileList([]) ; 
            setPatientInformation(undefined) ; 
            navigation("/studylist") ; 
        } else {
            showNotification("error", "Image Upload", `An error occurred while uploading ${failureCount} images.`)
            setFileList([]) ; 
            setPatientInformation(undefined) ; 
        }
    };
    

    return (
        <div className="main-div">
            <div className="dicom-upload-main-div">

                <Flex gap={8}>

                    <Button icon = {<DeleteOutlined/>} danger
                        onClick={StudyClearOptionHandler}
                    >
                    </Button>

                    <Button 
                        type="primary" 
                        icon = {<UploadOutlined/>} 
                        className="upload-to-server-button"
                        onClick={UploadImageHandler}
                        loading = {imageUploading}
                    >
                        {String("Upload to Server").toUpperCase()}
                    </Button>
                    
                    {patientInformation && (
                        <Flex style={{marginLeft: "auto"}}>
                            <div className="study-upload-patient-name">
                                <span>Patient : </span> {patientInformation?.data?.patient_name?.map((element) => element).join("")}
                            </div>

                            <div className="study-upload-divider">|</div>

                            <div className="study-upload-patient-name">
                                <span>Modality : </span> {patientInformation?.data?.modality}
                            </div>
                        </Flex>
                    )}
                </Flex> 


                <Spin spinning = {imageUploading}>
                    <Dragger {...props} style={{
                        backgroundColor: "#fff"
                    }} className="dicom-upload-image-drawer"
                        fileList={fileList}
                        onChange={({fileList}) => setFileList(fileList)}
                    >
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">Click or drag a file into this area to upload. Select DICOM images</p>
                    </Dragger>
                </Spin>   


            </div>
        </div>
    )
}

export default StudyUpload; 