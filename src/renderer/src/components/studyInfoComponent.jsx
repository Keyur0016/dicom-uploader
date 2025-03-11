import React, { useEffect, useState, useContext } from "react";
import { Row, Col, Button, Card, Tag, Badge, Statistic, Flex, Divider, Progress, Tooltip, Spin } from "antd";
import { CaretDownOutlined, CaretUpOutlined, DeleteFilled, FileImageFilled, UploadOutlined } from '@ant-design/icons';
import { checkJobStatusRequest, deleteParticularStudyRequest, fetchParticularStudyInfoRequest, fetchParticularStudySeriesInfoRequest, studyBackupStartRequest } from "../handler/study.handler";
import { useQuery } from "@tanstack/react-query";
import StudySeriesInfoComp from "./studySeriesInfoComp";
import { GlobalContext } from "../context/globalContext";
import { useMutation } from "@tanstack/react-query";
import { JOB_STATUS, JOB_TYPE, SERIES_STATUS } from "../constant/status.constant";
import { FILE_OPERATION_CONSTANT } from "../constant/constant";
import showNotification from "../handler/notification.handler";

const StudyInfoComponent = ({studyid}) => {

    const [timeCounter, setTimeCounter] = useState(100) ; 
    const [isExpand, setIsExpand] = useState(false) ; 
    const {studyList, setStudyList} = useContext(GlobalContext) ;
    const [backupJobID, setBackupJobID] = useState(undefined) ; 

    useEffect(() => {
        if (!studyList[studyid]){
            setStudyList((prev) => ({
                ...prev,
                [studyid]: {
                    "status": SERIES_STATUS.NOT_DELETED
                }
            }));
        }
    },[studyid])
    
    const {data: particularStudy, isLoading} = useQuery({
        queryKey: ["get", "particular", "studies", {"studyid": studyid}], 
        queryFn: async () => {
            let response = await fetchParticularStudyInfoRequest(studyid) ; 
            return response ; 
        }, 
        enabled: Boolean(studyid && studyList[studyid]?.status !== SERIES_STATUS.DELETE)
    }) ; 

    const {data: studySeries, isLoading: studySeriesLoading} = useQuery({
        queryKey: ['get', "particular", "studies", "series", {"studyid": studyid}], 
        queryFn: async () => {
            let response = await fetchParticularStudySeriesInfoRequest(studyid) ; 
            setStudyList((prevStudyList) => {
                const updatedStudyList = { ...prevStudyList };
                response?.forEach((element) => {
                    if (!updatedStudyList[element?.id]) {
                        updatedStudyList[element?.id] = {};
                    }
                });
            
                return updatedStudyList;
            });
            return response ; 
        }, 
        enabled: Boolean(studyid && studyList[studyid]?.status !== SERIES_STATUS.DELETE), 
        refetchInterval: 1000, 
        refetchIntervalInBackground: true
    })

    const { mutate: deleteStudy, isLoading: isStudyDeleting } = useMutation({
        mutationFn: async (studyId) => {
            return await deleteParticularStudyRequest(studyId);
        }
    });

    // Delete button related request handler ============================
    const deleteButtonHandler = async () => {
        setStudyList((prev) => ({
            ...prev, 
            [studyid]: {
                ...prev[studyid], 
                status: SERIES_STATUS.DELETE, 
            }
        }));
        let backupResponse = await studyBackupStartRequest(studyid) ; 
        setBackupJobID(backupResponse?.ID) ; 
    }

    // Check particular job related status ===========================
    const {data: jobStatusResponse, isLoading: isJobStatusLoading} = useQuery({
        queryKey: ["get", "particular", "job", 'status', {"job_id": backupJobID}], 
        queryFn: async () => {
            let response = await checkJobStatusRequest(backupJobID);
            let job_status = response?.State; 
            let job_type = response?.Type ; 
            if (job_status == JOB_STATUS.SUCCESS_STATUS){
                if (job_type == JOB_TYPE.ARCHIVE_TYPE){
                    setBackupJobID(undefined) ; 
                    await window.electronAPI.backUpFolderHandler({backupJobID, particularStudy}) ;
                    window.electronAPI.studyBackupSuccess((event, message) => {
                        showNotification("success", "Study Delete", message) ; 
                    })
                    window.electronAPI.backupFolderReply((event, message) => {
                        showNotification("error", "Study Delete", message) ; 
                    })
                }
            }

            return response ; 
        }, 
        enabled: Boolean(backupJobID), 
        refetchInterval: 1500, 
        refetchIntervalInBackground: true
    }) ; 

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeCounter((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(interval); // Cleanup interval on unmount
    }, []);

    if (studyList?.[studyid] && studyList?.[studyid]?.status == SERIES_STATUS.NOT_DELETED){
        return (
            <Badge.Ribbon text = {`Total series: ${studySeries?.length ?? 0}`} placement="end">
                <Card className={`study-info-comp ${!isExpand?`study-info-comp-collapsed`:``} study-info-upload-error`}
                    style={{height: isExpand?"auto":"230px"}}
                >
                    <Spin spinning = {isLoading}>
    
                        <Row gutter={[16, 16]} align="middle">
                            <Col span={24}>
                                <Flex gap={10}>

                                    <Tooltip title = "Expand section">
                                        <Button 
                                            type="primary" 
                                            icon={isExpand?<CaretUpOutlined/>:<CaretDownOutlined />} 
                                            style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', color: '#fff' }}
                                            onClick={() => {
                                                setIsExpand((prev) => !prev)
                                            }}
                                        >
                                        </Button>
                                    </Tooltip>
    
                                    <Button 
                                        danger 
                                        icon = {<DeleteFilled/>}
                                        onClick={() => {deleteButtonHandler()}}
                                    >
                                    </Button>
                                    
                                    <Button type="default" className="upload-study-button" icon = {<UploadOutlined/>} >
                                        Upload Study
                                    </Button>
                                    
                                    <div style={{
                                        marginTop: "auto", 
                                        marginBottom: "auto", 
                                    }} className="timer-information">
                                        <span className="patient-data-title">Time Remain :</span> {timeCounter}
                                    </div>
                                </Flex>
                            </Col>
                        </Row>
    
                        <Row gutter={[16, 16]} style={{ marginTop: "5px" }}>
                            <Col span={12}>
    
                                {/* Patient id  */}
                                <div className="patient-data-div">
                                    <span className="patient-data-title">Patient id :</span> {particularStudy?.PatientMainDicomTags?.PatientID ?? "---"}
                                </div>
    
                                {/* Study id  */}
                                <div className="patient-data-div">
                                    <span className="patient-data-title">Study id :</span> {particularStudy?.ID ?? "--"}
                                </div>
    
                                {/* Modality  */}
                                <div className="patient-data-div">
                                    <span className="patient-data-title">
                                        Modality : 
                                    </span> {particularStudy?.RequestedTags?.ModalitiesInStudy ?? "--"}
                                </div>
                            </Col>
    
                            <Col span={12}>
    
                                {/* Patient name  */}
                                <div className="patient-data-div">
                                    <span className="patient-data-title">Patient name :</span> {particularStudy?.PatientMainDicomTags?.PatientName ?? "--"}
                                </div>
    
                                {/* Total images information  */}
                                <div className="patient-data-div">
                                    <span className="patient-data-title">
                                        <Tag color="#2db7f5">Total Images</Tag>
                                    </span> {particularStudy?.RequestedTags?.NumberOfStudyRelatedInstances ?? "0"}
                                </div>
    
                            </Col>
                        </Row>
    
                        <Divider style={{
                            marginTop: 15,
                            marginBottom: 3, 
                            background: "#d3d3d3"
                        }}/>
    
                        {/* Particular Study series information related status information  */}
                        {studySeries && studySeries?.map((element, index) => {
                            return(
                                <StudySeriesInfoComp
                                    seriesId={element?.ID}
                                    index={index + 1}
                                    modality={element?.MainDicomTags?.Modality ?? "--"}
                                    imagecount={element?.Instances?.length ?? 0}
                                />
                            )
                        })}
    
                    </Spin>
    
                </Card>
            </Badge.Ribbon>
    
        )
    }
}

export default StudyInfoComponent; 