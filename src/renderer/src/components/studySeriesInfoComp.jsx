import { Row, Flex, Tooltip, Tag, Progress } from "antd";
import React, { useState } from "react";
import { FileImageFilled } from "@ant-design/icons";

const StudySeriesInfoComp = ({seriesId, index, modality, imagecount, uploaded}) => {

    return (
        <Row gutter={[16, 16]} 
            style={{ marginTop: "5px", fontSize: 18, borderTopWidth: index == 1?0:1 }}
            className="particular-series-index"
        >
            <Flex className="particular-series-info-div">

                {/* Series index informaiton  */}
                <span className="particular-series-info-index">{index}</span>

                <div className="particular-series-progres-info-div">
                    <Progress 
                        percent={uploaded} 
                        steps={4} 
                        size={13} 
                        strokeColor={
                            uploaded < 30 ? "yellow" :
                            uploaded >= 30 && uploaded < 70 ? "blue" :
                            uploaded >= 70 && uploaded <= 100 ? "green" : "red"
                        } 
                    />
                </div>

                {/* Modality information  */}
                <div className="patient-series-modality">
                    <span className="patient-data-title">
                        <Tag color="#f50">Modality</Tag>
                    </span> {modality}
                </div>

                {/* Series total images related information  */}
                <Flex className="patient-series-image-count">
                    <Tooltip title={`DICOM IMAGES : ${imagecount}`}>
                        <FileImageFilled />
                        <span style={{
                            marginLeft: 6, 
                            fontWeight: 600, 
                            fontSize: 16
                        }}>: {imagecount}</span>
                    </Tooltip>
                </Flex>

            </Flex>
        </Row>
    )
}

export default StudySeriesInfoComp ; 