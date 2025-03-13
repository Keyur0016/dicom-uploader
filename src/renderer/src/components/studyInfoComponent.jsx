import React, { useEffect, useState, useContext, useRef } from "react";
import { Row, Col, Button, Card, Tag, Badge, Statistic, Flex, Divider, Progress, Tooltip, Spin, List } from "antd";
import { CaretDownOutlined, CaretUpOutlined, DeleteFilled, FileImageFilled, UploadOutlined } from '@ant-design/icons';
import { checkJobStatusRequest, deleteParticularSeriesRequest, deleteParticularStudyRequest, fetchParticularStudyInfoRequest, fetchParticularStudySeriesInfoRequest, jobDeleteRequest, seriesBackupStartRequest, studyBackupStartRequest, studyPeerStoreRequest } from "../handler/study.handler";
import { useQuery } from "@tanstack/react-query";
import StudySeriesInfoComp from "./studySeriesInfoComp";
import { GlobalContext } from "../context/globalContext";
import { useMutation } from "@tanstack/react-query";
import { JOB_STATUS, JOB_TYPE, SERIES_STATUS } from "../constant/status.constant";
import showNotification from "../handler/notification.handler";
import { insertNewStudiesDataRequest, insertStudyUploadTimeInfoRequest } from "../handler/user.handler";
import moment from "moment";
import { useQueries } from "@tanstack/react-query";

const StudyInfoComponent = ({studyid, userInformation, setCacheStudyList}) => {

    const studyBackupRun = useRef(false); 

    // **** State **** // 
    const [timeCounter, setTimeCounter] = useState(undefined) ; 
    const [isExpand, setIsExpand] = useState(false) ; 
    const {studyList, setStudyList} = useContext(GlobalContext) ;
    const [backupJobID, setBackupJobID] = useState(undefined) ; 
    const [totalInstanceCount, setTotalInstanceCount] = useState(0) ; 
    const [studySeriesList, setStudySeriesList] = useState([]) ; 

    // **** Study backup related functionality handler *** // 
    const [studyBackupJobId, setStudyBackupJobId] = useState(undefined);
    const [studyBackupRefetch, setStudyBackupRefetch] = useState(0) ; 
    const [studyBackupInstanceCount, setStudyBackupInstanceCount] = useState(0) ;

    // **** Store particular series once bakup done ***** // 
    const [seriesDeleteQueue, setSeriesDeleteQueue] = useState([]) ; 

    const [uploadingStatus, setUploadingStatus] = useState(undefined) ; 
    const [uploadingSeriesJobId, setUploadingSeriesJobId] = useState([]) ; 
    const [isUploading, setIsUploading] = useState(false) ; 
    const [isUploadingInitiate, setIsUploadingInitiate] = useState(false) ; 

    // **** Delete study related handler **** // 
    const [isDeleteInitiate, setIsDeleteInitiate] = useState(false) ; 

    // Configure auto upload delay related information //
    useEffect(() => {
        let settingData = localStorage.getItem("dicom-setting") ; 
        if (settingData){
            settingData = JSON.parse(settingData) ; 
            setTimeCounter(+settingData?.delay)
        }   else {
            setTimeCounter(+20)
        }
    },[])

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

    // ***** Fetch particular study info 
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

    // ***** Fetch study series info
    const {data: studySeries, isLoading: studySeriesLoading} = useQuery({
        queryKey: ['get', "particular", "studies", "series", {"studyid": studyid}], 
        queryFn: async () => {
            let response = await fetchParticularStudySeriesInfoRequest(studyid) ; 
            setStudyList((prevStudyList) => {
                const updatedStudyList = { ...prevStudyList };
                if (response?.length > 0){
                    response?.forEach((element) => {
                        if (!updatedStudyList[studyid][element?.ID]) {
                            updatedStudyList[studyid][element?.ID] = {
                                "metadata": element,
                                "status": SERIES_STATUS.UPLOAD_PENDING
                            };
                        }
                    });
                }
            
                return updatedStudyList;
            });
            return response ; 
        }, 
        enabled: Boolean(studyid && studyList[studyid]?.status !== SERIES_STATUS.DELETE), 
        refetchInterval: 1000, 
        refetchIntervalInBackground: true
    })

    // Total instance count related information
    useEffect(() => {
        if (studySeries && studySeries?.length){
            let total_instance = 0 ;
            studySeries?.map((element) => {
                total_instance += element?.Instances?.length ; 
            })

            if (total_instance > totalInstanceCount) {
                setTotalInstanceCount(total_instance) ;
            }
        }
        if (studySeries?.length > studySeriesList?.length){
            setStudySeriesList(studySeries)
        }

    },[studySeries]) ; 

    // Auto upload time interval count 
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


    // ************* Delete study button related option handler ************* // 
    useEffect(() => {
        const handleDelete = async () => {
            if (studyList?.[studyid]?.status && isDeleteInitiate) {
                if (studyList[studyid].status === SERIES_STATUS.BACKUP_DONE) {
                    setStudyList((prev) => ({
                        ...prev,
                        [studyid]: {
                            ...prev[studyid],
                            status: SERIES_STATUS.DELETE,
                        },
                    }));
                    await deleteParticularStudyRequest(studyid);
                    showNotification("success", "Study Deleted", "Study has been deleted successfully");
                    
                    setCacheStudyList((prev) => {
                        const updatedList = { ...prev };
                        delete updatedList[studyid]; // Remove the key from the object
                        return updatedList;
                    });
                }
            }
        };
    
        handleDelete(); 
    }, [isDeleteInitiate, studyList, studyid]); 
    
    // ****** Start study backup when received study information ****** // 
    useEffect(() => {
        if (studyid && !studyBackupRun.current){
            studyBackupRun.current = true ; 
            const startBackup = async () => {
                await new Promise(resolve => setTimeout(resolve, 5000)); // Delay for 5 seconds
                try {
                    let backupResponse = await studyBackupStartRequest(studyid);
                    setStudyBackupJobId(backupResponse?.ID);
                } catch (error) {
                    console.error("Error starting backup:", error);
                }
            };
            startBackup(); // Call the async function
        }
    }, [studyid, studyBackupRefetch]);
    

    // Check particular study job backup status when user click on DELETE STUDY // 
    const { data: jobStatusResponse, isLoading: isJobStatusLoading } = useQuery({
        queryKey: ["get", "particular", "job", "status", backupJobID], 
        queryFn: async () => {
            const response = await checkJobStatusRequest(backupJobID);
            return response; 
        },
        enabled: Boolean(backupJobID),
        refetchInterval: 1500,
        refetchIntervalInBackground: true,
    });
    
    useEffect(() => {
        if (jobStatusResponse?.State === JOB_STATUS.SUCCESS_STATUS && jobStatusResponse?.Type === JOB_TYPE.ARCHIVE_TYPE) {
            (async () => {
                try {
                    setBackupJobID(undefined); 
                    await window.electronAPI.backUpFolderHandler({ backupJobID, particularStudy });
    
                    window.electronAPI.studyBackupSuccess(async (event, message) => {
                        showNotification("success", "Study Delete", message);
                        await deleteParticularStudyRequest(studyid);
                    });
    
                    window.electronAPI.backupFolderReply((event, message) => {
                        showNotification("error", "Study Delete", message);
                    });
                } catch (error) {
                    console.error("Error handling backup success:", error);
                }
            })();
        }
    }, [jobStatusResponse, backupJobID, particularStudy, studyid]);
    
    
    // Check particular study backup status related job 
    const {data: studyBackupJobData} = useQuery({
        queryKey: ["get", "particular", "job", 'status', {"job_id": studyBackupJobId}], 
        queryFn: async () => {
            let response = await checkJobStatusRequest(studyBackupJobId);
            let job_status = response?.State;
            let job_type = response?.Type ; 
            let job_backup_instance_count = response?.Content?.InstancesCount ; 
            setStudyBackupInstanceCount(job_backup_instance_count) ; 
            if (job_status == JOB_STATUS.SUCCESS_STATUS){
                if (job_type == JOB_TYPE.ARCHIVE_TYPE){

                    if (+job_backup_instance_count === +totalInstanceCount){
                        setStudyList((prev) => ({
                            ...prev,
                            [studyid]: {
                                ...(prev?.[studyid] || {}), // Ensure `prev[studyid]` exists
                                status: SERIES_STATUS.BACKUP_DONE,
                            },
                        }));
                    }   else {
                        setStudyBackupRefetch((prev) => prev + 1) ; 
                        studyBackupRun.current = false ; 
                    }


                    await window.electronAPI.backUpFolderHandler({backupJobID : studyBackupJobId, particularStudy}) ;
                    window.electronAPI.studyBackupSuccess(async (event, message) => {
                        setStudyBackupJobId(undefined) ; 
                    });
                    window.electronAPI.backupFolderReply(async (event, message) => {
                        setStudyBackupJobId(undefined) ; 
                    });
                }
            }
            return response ; 
        }, 
        enabled: Boolean(studyBackupJobId), 
        refetchInterval: 1500, 
        refetchIntervalInBackground: true
    }) ; 

    // ***** Cloudimts --- Insert new studies info
    const {mutateAsync: insertStudyData, isPending} = useMutation({
        mutationKey: ["insert", "studies", "information", "live-server"],
        mutationFn: async (data) => {
            let response = await insertNewStudiesDataRequest(data) ; 
            return response; 
        }
    })

    // ***** Orthanc peer store request 
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
    
    // ****************************** Study upload button click handler ******************************* // 
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
                                status: SERIES_STATUS.UPLOAD_START,
                                jobID: response?.ID,
                                uploadPercentage: 0, 
                                cloudimts_series_id : response?.series, 
                                cloudimts_reference_id: response?.reference_series_id
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

    const uploadStudyButtonHandler = async () => {
        setUploadingStatus(SERIES_STATUS.UPLOAD_START) ; 
        setIsUploading(true) ; 
        await uploadHandler() ; 
    }
    
    const [hasTriggeredUpload, setHasTriggeredUpload] = useState(false);
    useEffect(() => {
        if (!hasTriggeredUpload && !isDeleteInitiate && (isUploadingInitiate || timeCounter <= 0)) {
            setIsUploadingInitiate(true);
            uploadStudyButtonHandler();
            setHasTriggeredUpload(true);
        }
    }, [timeCounter, isUploadingInitiate, isDeleteInitiate, hasTriggeredUpload]);

    // ***** Delete particular seriesDeleteQueue related handler ***** // 
    const SeriesDeleteHandler = async () => {
        if (seriesDeleteQueue?.length > 0) {
            const updatedQueue = [...seriesDeleteQueue]; // Clone the queue to avoid modifying state in the loop
            for (const seriesId of seriesDeleteQueue) {
                await deleteParticularSeriesRequest(seriesId);
                const index = updatedQueue.indexOf(seriesId);
                if (index !== -1) updatedQueue.splice(index, 1); // Remove seriesId after deletion
            }
            setSeriesDeleteQueue(updatedQueue); // Update state once after loop
        }
    };
    useEffect(() => {
        if (
            studyList?.[studyid]?.status === SERIES_STATUS.BACKUP_DONE &&
            seriesDeleteQueue?.length > 0
        ) {
            SeriesDeleteHandler();
        }
    }, [seriesDeleteQueue, studyList, studyid]);
    

    // ****** Check all peer store related job status related information 
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

                            // ***** Update uploading series job id
                            setUploadingSeriesJobId((prev) => prev?.filter((item) => item != job_id))

                            // ***** Add particular series id to seriesDeleteQueue
                            setSeriesDeleteQueue((prev) => ([...prev, job_series_id]))
                            // await deleteParticularSeriesRequest(job_series_id)

                            // ***** Delete partciular job information
                            await jobDeleteRequest(job_id)

                            // ***** Insert study upload time 
                            let studySize = (+response?.Content?.Size ?? 0) / 1048576;
                            let insertStudyUploadTime = await insertStudyUploadTimeInfoRequest({
                                time: moment().format("YYYY-MM-DD HH:mm:ss"), 
                                id: studyList?.[studyid]?.[job_series_id]?.cloudimts_series_id, 
                                size: parseFloat(studySize).toFixed(2), 
                                institution_id: userInformation?.institution_id
                            })
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


    // ***** Handle final study status based on study status ***** // 
    useEffect(() => {
        if (!uploadingSeriesJobId?.length) {
            // Extract unique statuses
            const all_status = new Set();
    
            studySeriesList?.forEach((element) => {
                const status = studyList?.[studyid]?.[element?.ID]?.status;
                if (status) {
                    all_status.add(status);
                }
            });
    
            // Convert Set to an array
            const uniqueStatuses = [...all_status];
    
            // Determine final upload status
            if (uniqueStatuses.length === 1) {
                if (uniqueStatuses[0] === SERIES_STATUS.UPLOAD_SUCCESS) {
                    setUploadingStatus(SERIES_STATUS.UPLOAD_SUCCESS);
                } else if (uniqueStatuses[0] === SERIES_STATUS.UPLOAD_FAILED) {
                    setUploadingStatus(SERIES_STATUS.UPLOAD_FAILED);
                }
            }
        }
    }, [uploadingSeriesJobId, studySeriesList, studyList, studyid]);
    

    if (studyList?.[studyid] && (studyList?.[studyid]?.status == SERIES_STATUS.NOT_DELETED || studyList?.[studyid]?.status == SERIES_STATUS.BACKUP_DONE)){
        return (
            <Badge.Ribbon text = {`Total series: ${studySeriesList?.length ?? 0}`} placement="end">
                <Card className={`study-info-comp ${!isExpand?`study-info-comp-collapsed`:``} 
                    ${
                        uploadingStatus == SERIES_STATUS.UPLOAD_START?`study-info-upload-start`:
                        uploadingStatus == SERIES_STATUS.UPLOAD_FAILED?`study-info-upload-error`:
                        uploadingStatus == SERIES_STATUS.UPLOAD_SUCCESS?`study-info-upload-success`:``
                    }
                `}
                    style={{height: isExpand?"auto":"230px"}}
                >
                    <Spin spinning = {isLoading || isDeleteInitiate}>
    
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
                                        onClick={() => {
                                            setIsDeleteInitiate(true) ; 
                                        }}
                                        disabled = {isUploadingInitiate || isDeleteInitiate}
                                        isLoading = {isDeleteInitiate}
                                    >
                                    </Button>
                                    
                                    <Button type="default" className="upload-study-button" icon = {<UploadOutlined/>} 
                                        onClick={() => {
                                            setIsUploading(true) ; 
                                            setIsUploadingInitiate(true) ; 
                                        }}
                                        loading = {isUploadingInitiate}
                                        disabled = {isDeleteInitiate}
                                    >
                                        {
                                            uploadingStatus === undefined ? "Upload Study" : 
                                            uploadingStatus === SERIES_STATUS.UPLOAD_SUCCESS ? "Uploading Done" : 
                                            uploadingStatus === SERIES_STATUS.UPLOAD_FAILED ? "Uploading Failed" : 
                                            uploadingStatus === SERIES_STATUS.UPLOAD_START ? "Uploading" : ""
                                        }

                                    </Button>
                                    
                                    {!isUploadingInitiate && !isDeleteInitiate && (
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
                        {studySeriesList && studySeriesList?.length > 0 && studySeriesList?.map((element, index) => {
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