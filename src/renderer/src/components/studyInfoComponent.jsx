import React, { useEffect, useState, useContext } from "react";
import { Row, Col, Button, Card, Tag, Badge, Statistic, Flex, Divider, Progress, Tooltip, Spin, List } from "antd";
import { CaretDownOutlined, CaretUpOutlined, DeleteFilled, FileImageFilled, UploadOutlined } from '@ant-design/icons';
import { checkJobStatusRequest, deleteParticularStudyRequest, fetchParticularStudyInfoRequest, fetchParticularStudySeriesInfoRequest, seriesBackupStartRequest, studyBackupStartRequest, studyPeerStoreRequest } from "../handler/study.handler";
import { useQuery } from "@tanstack/react-query";
import StudySeriesInfoComp from "./studySeriesInfoComp";
import { GlobalContext } from "../context/globalContext";
import { useMutation } from "@tanstack/react-query";
import { JOB_STATUS, JOB_TYPE, SERIES_STATUS } from "../constant/status.constant";
import showNotification from "../handler/notification.handler";
import { insertNewStudiesDataRequest } from "../handler/user.handler";
import moment from "moment";
import { useQueries } from "@tanstack/react-query";

const StudyInfoComponent = ({studyid}) => {

    const [timeCounter, setTimeCounter] = useState(undefined) ; 
    const [isExpand, setIsExpand] = useState(false) ; 
    const {studyList, setStudyList} = useContext(GlobalContext) ;
    const [backupJobID, setBackupJobID] = useState(undefined) ; 
    const [seriesBackupJobId, setSeriesBackupJobId] = useState([]) ; 
    const [seriesBackupJobSeriesInfo, setSeriesBackupJobSeriesInfo] = useState({}) ; 
    const [totalInstanceCount, setTotalInstanceCount] = useState(0) ; 

    const [uploadingStatus, setUploadingStatus] = useState(undefined) ; 
    const [uploadingSeriesJobId, setUploadingSeriesJobId] = useState([]) ; 
    const [isUploading, setIsUploading] = useState(false) ; 
    const [isUploadingInitiate, setIsUploadingInitiate] = useState(false) ; 

    useEffect(() => {
        if (!studyList[studyid]){
            setStudyList((prev) => ({
                ...prev,
                [studyid]: {
                    "status": SERIES_STATUS.NOT_DELETED, 
                }
            }));
        }
    },[studyid])

    const {data: particularStudy, isLoading} = useQuery({
        queryKey: ["get", "particular", "studies", {"studyid": studyid}], 
        queryFn: async () => {
            let response = await fetchParticularStudyInfoRequest(studyid) ; 
            setStudyList((prev) => ({
                ...prev, 
                [studyid] : {
                    ...prev[studyid], 
                    "metadata": response
                }
            }))
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
                    if (!updatedStudyList[studyid][element?.ID]) {
                        updatedStudyList[studyid][element?.ID] = {
                            "metadata": element,
                            "status": SERIES_STATUS.UPLOAD_PENDING
                        };
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

    useEffect(() => {
        if (studySeries && studySeries?.length){
            let totaL_instance = 0 ;
            studySeries?.map((element) => {
                totaL_instance += element?.Instances?.length ; 
            })
            setTotalInstanceCount(totaL_instance) ;
        }
    },[studySeries])

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
            setTimeCounter((prev) => {
                if (prev <= 0) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval); // Cleanup interval on unmount
    }, []);

    // Insert studies information ===================================================
    const {mutateAsync: insertStudyData, isPending} = useMutation({
        mutationKey: ["insert", "studies", "information", "live-server"],
        mutationFn: async (data) => {
            let response = await insertNewStudiesDataRequest(data) ; 
            return response; 
        }
    })

    // Orthanc peer store related request handler ==================================
    const {mutateAsync: orthancStore, isPending: isOrthancStore} = useMutation({
        mutationKey: ["orthanc", "peer", "store"], 
        mutationFn: async (data) => {
            let orthanc_peer_data = localStorage.getItem("orthanc-peer-data") ; 
            if (orthanc_peer_data){
                orthanc_peer_data = JSON.parse(orthanc_peer_data) ; 
                let response = await studyPeerStoreRequest(data, orthanc_peer_data?.orthanc_peer) ;
                return response ; 
            }   else {
                throw new Error("Not have orthanc peer related information")
            }
        }
    })

    const uploadHandler = async () => {
        for (const element of studySeries ?? []) {
            const seriesData = studyList?.[studyid]?.[element?.ID];
            if (seriesData?.status === SERIES_STATUS.UPLOAD_PENDING) {
                const requestPayload = {
                    study_metadata: studyList?.[studyid]?.metadata,
                    series_metadata: seriesData?.metadata,
                    upload_start_time: moment().format("YYYY-MM-DD HH:mm:ss"),
                    total_instance: particularStudy?.RequestedTags?.NumberOfStudyRelatedInstances ?? 0,
                    modality: seriesData?.metadata?.MainDicomTags?.Modality ?? "--",
                };
    
                try {
                    let series_response = await insertStudyData(requestPayload);
                    if (series_response?.status) {
                        let response = await orthancStore({
                            "Asynchronous": true, 
                            "Compress": true, 
                            "Permissive": true,  
                            "Priority": 0, 
                            "Resources": [element?.ID], 
                            "Synchronous": false
                        });
                        
                        setUploadingSeriesJobId((prev) => ([
                            ...prev, 
                            response?.ID
                        ]))
                        setStudyList((prev) => ({
                            ...prev,
                            [studyid]: {
                              ...prev[studyid],
                              [element?.ID]: {
                                ...prev[studyid]?.[element?.ID],
                                // status: SERIES_STATUS.UPLOAD_START,
                                jobID: response?.ID,
                                uploadPercentage: 0
                              },
                            },
                        }));
                          
                    }
                } catch (error) {
                    console.error("Error inserting study data:", error);
                }
            }
        }
    };
    
    // Upload study related option handler ========================================
    const uploadStudyButtonHandler = async () => {
        setUploadingStatus(SERIES_STATUS.UPLOAD_START) ; 
        setIsUploading(true) ; 
        setIsUploadingInitiate(true) ; 
        await uploadHandler() ; 
    }

    // Particular peer store related request ===========================================
    const jobQueries = useQueries({
        queries: (uploadingSeriesJobId ?? [])?.map((job_id) => {
            return {
                queryKey: ["get", "peer", "store", "status", job_id], 
                queryFn: async () => {
                    let response = await checkJobStatusRequest(job_id); 
                    let job_type = response?.Type ; 
                    let job_status = response?.State ;
                    let job_progress = response?.Progress ; 
                    let job_series_id = response?.Content?.ParentResources[0]
                    if (job_type === JOB_TYPE.CLOUDPEER_STORE_TYPE){
                        if (job_status == JOB_STATUS.SUCCESS_STATUS){
                            setUploadingSeriesJobId((prev) => prev?.filter((item) => item !== job_id));
                            let backupResponse = await seriesBackupStartRequest(job_series_id) ;
                            console.log("Backup job start", backupResponse);
                            
                            if (backupResponse?.ID) {
                                setSeriesBackupJobId((prev) => ([
                                    ...prev, 
                                    backupResponse?.ID
                                ]));
                            }
                            setSeriesBackupJobSeriesInfo((prev) => ({
                                ...prev, 
                                [backupResponse?.ID] : job_series_id 
                            }))
                        }
                        setStudyList((prev) => ({
                            ...prev,
                            [studyid]: {
                                ...prev[studyid],
                                [job_series_id]: {
                                    ...prev[studyid]?.[job_series_id], 
                                    status:
                                        job_status === JOB_STATUS.SUCCESS_STATUS
                                            ? SERIES_STATUS.UPLOAD_SUCCESS
                                            : [JOB_STATUS.FAILED_STATUS, JOB_STATUS.CANCELLED_STATUS].includes(job_status)
                                                ? SERIES_STATUS.UPLOAD_FAILED
                                                : SERIES_STATUS.UPLOAD_START, 
                                    percentage: job_progress
                                }
                            }
                        }));
                    }
                    return response;
                },
                refetchInterval: 1000, 
                refetchIntervalInBackground: true
            }
        })
    });

    // Series backup related job id status check =======================================================
    const seriesBackupQueries = useQueries({
        queries: (seriesBackupJobId ?? [])?.map((jobId) => {
            return {
                queryKey: ["get", "series", "backup", "job", jobId] ,
                queryFn: async () => {
                    let response = await checkJobStatusRequest(jobId);
                    let job_status = response?.State ; 
                    let job_type = response?.Type ; 
                    if (job_status === JOB_STATUS.SUCCESS_STATUS){
                        if (job_type === JOB_TYPE.ARCHIVE_TYPE){
                            console.log("Match ");
                            
                            setSeriesBackupJobId((prev) => prev?.filter((item) => item !== jobId));
                            await window.electronAPI.SeriesBackUpFolderHandler({
                                particularStudy: studyList[studyid]?.metadata, 
                                backupJobID: jobId, 
                                series_id: seriesBackupJobSeriesInfo[jobId]
                            })
                        }
                    }
                    return response ;
                }, 
                refetchInterval: 1000, 
                refetchIntervalInBackground: true
            }
        })
    })

    // Final study status related functionality handler ===============================================
    useEffect(() => {
        if (seriesBackupJobId?.length == 0 ){
            setIsUploading(false) ; 

            // Check upload status 
            let all_status = [] ;
            studySeries?.map((element) => {
                if (studyList?.[studyid]?.[element?.ID]?.status){
                    all_status.push(studyList?.[studyid]?.[element?.ID]?.status)
                }
            })

            all_status = [...new Set([...all_status])];
            
            if (all_status?.length == 1 && all_status[0] == SERIES_STATUS.UPLOAD_SUCCESS){
                setUploadingStatus(SERIES_STATUS.UPLOAD_SUCCESS)
            }   else if (all_status?.length == 1 && all_status[0] == SERIES_STATUS.UPLOAD_FAILED){
                setUploadingStatus(SERIES_STATUS.UPLOAD_FAILED)
            }   else {
                // setUploadingStatus(undefined)
            }
            
        }   
    }, [seriesBackupJobId])

    // Configure auto uploader time related information 
    useEffect(() => {
        let settingData = localStorage.getItem("dicom-setting") ; 
        if (settingData){
            settingData = JSON.parse(settingData) ; 
            setTimeCounter(+settingData?.delay)
        }   else {
            setTimeCounter(+20)
        }
    },[])

    // Check if timer count is zero than start auto uplaoding 
    useEffect(() => {
        if (timeCounter <=0){
            uploadStudyButtonHandler() ; 
        }
    },[timeCounter])

    if (studyList?.[studyid] && studyList?.[studyid]?.status == SERIES_STATUS.NOT_DELETED){
        return (
            <Badge.Ribbon text = {`Total series: ${studySeries?.length ?? 0}`} placement="end">
                <Card className={`study-info-comp ${!isExpand?`study-info-comp-collapsed`:``} 
                    ${
                        uploadingStatus == SERIES_STATUS.UPLOAD_START?`study-info-upload-start`:
                        uploadingStatus == SERIES_STATUS.UPLOAD_FAILED?`study-info-upload-error`:
                        uploadingStatus == SERIES_STATUS.UPLOAD_SUCCESS?`study-info-upload-success`:``
                    }
                `}
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
                                        disabled = {isUploadingInitiate}
                                    >
                                    </Button>
                                    
                                    <Button type="default" className="upload-study-button" icon = {<UploadOutlined/>} 
                                        onClick={() => {uploadStudyButtonHandler()}}
                                        loading = {isUploadingInitiate}
                                    >
                                        {
                                            uploadingStatus === undefined ? "Upload Study" : 
                                            uploadingStatus === SERIES_STATUS.UPLOAD_SUCCESS ? "Uploading Done" : 
                                            uploadingStatus === SERIES_STATUS.UPLOAD_FAILED ? "Uploading Failed" : 
                                            uploadingStatus === SERIES_STATUS.UPLOAD_START ? "Uploading" : ""
                                        }

                                    </Button>
                                    
                                    {!isUploadingInitiate && (
                                        <div style={{
                                            marginTop: "auto", 
                                            marginBottom: "auto", 
                                        }} className="timer-information">
                                            <span className="patient-data-title">Time Remain :</span> {timeCounter}
                                        </div>
                                    )}
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
                                    </span> {totalInstanceCount ?? "0"}
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
                                    uploaded={studyList?.[studyid]?.[element?.ID]?.percentage ?? 0}
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