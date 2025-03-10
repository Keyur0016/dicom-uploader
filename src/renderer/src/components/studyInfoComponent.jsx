import React, { useEffect, useState, useContext } from "react";
import { Row, Col, Button, Card, Tag, Badge, Statistic, Flex, Divider, Progress, Tooltip, Spin } from "antd";
import { CaretDownOutlined, DeleteFilled, FileImageFilled, UploadOutlined } from '@ant-design/icons';
import { deleteParticularStudyRequest, fetchParticularStudyInfoRequest, fetchParticularStudySeriesInfoRequest } from "../handler/study.handler";
import { useQuery } from "@tanstack/react-query";
import StudySeriesInfoComp from "./studySeriesInfoComp";
import { GlobalContext } from "../context/globalContext";

const StudyInfoComponent = ({studyid}) => {

    const [timeCounter, setTimeCounter] = useState(100) ; 
    const [isExpand, setIsExpand] = useState(false) ; 
    const {studyList, setStudyList} = useContext(GlobalContext) ; 

    useEffect(() => {
        if (!studyList[studyid]){
            setStudyList((prev) => ({
                ...prev,
                studyid: {}
            }));
        }
    },[studyid])
    
    const {data: particularStudy, isLoading} = useQuery({
        queryKey: ["get", "particular", "studies", {"studyid": studyid}], 
        queryFn: async () => {
            let response = await fetchParticularStudyInfoRequest(studyid) ; 
            return response ; 
        }, 
        enabled: Boolean(studyid)
    }) ; 

    const {data: studySeries, isLoading: studySeriesLoading} = useQuery({
        queryKey: ['get', "particular", "studies", "series", {"studyid": studyid}], 
        queryFn: async () => {
            let response = await fetchParticularStudySeriesInfoRequest(studyid) ; 
            let temp = studyList ; 
            response?.map((element) => {
                if (!temp[element?.id]){
                    temp[element?.id] = {
                        
                    }
                }
            })

            setStudyList(temp) ; 
            return response ; 
        }, 
        enabled: Boolean(studyid), 
        refetchInterval: 1000, 
        refetchIntervalInBackground: true
    })

    // const {data: studyDelete, isLoading: isStudyDeleting} = useQuery({
    //     queryKey: ["delete", "particular", "study", {"studyId": studyid}], 
    //     queryFn: async () => {
    //         let response = await deleteParticularStudyRequest(studyid) ; 
    //         return response ; 
    //     }
    // })

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeCounter((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(interval); // Cleanup interval on unmount
    }, []);


    return (
        <Badge.Ribbon text = {`Total series: ${studySeries?.length ?? 0}`} placement="end">
            <Card className={`study-info-comp ${!isExpand?`study-info-comp-collapsed`:``} study-info-upload-error`}
                style={{height: isExpand?"auto":"230px"}}
            >
                <Spin spinning = {isLoading}>

                    <Row gutter={[16, 16]} align="middle">
                        <Col span={24}>
                            <Flex gap={10}>
                                <Button 
                                    type="primary" 
                                    icon={<CaretDownOutlined />} 
                                    style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', color: '#fff' }}
                                    onClick={() => {
                                        setIsExpand((prev) => !prev)
                                    }}
                                >
                                </Button>
                                <Button danger icon = {<DeleteFilled/>}></Button>
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

export default StudyInfoComponent; 