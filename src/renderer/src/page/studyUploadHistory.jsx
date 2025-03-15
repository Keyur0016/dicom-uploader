import React, {useState, useEffect} from "react";
import { Empty, Table } from "antd";
import { useQuery } from "@tanstack/react-query";
import { getUserUploadHistoryRequest } from "../handler/user.handler";
import { PAGE_SIZE_LIMIT } from "../constant/common.constant";
import moment from "moment";

const StudyUploadHistory = () => {
    
    const [currentPage, setCurrentPage] = useState(0) ;
    
    const columns = [
        {
            title: "ID", 
            render: (text, record, index) => {
                return(
                    <div style={{
                        fontWeight: 600,
                        color: "#000"
                    }}>
                        {index + 1}
                    </div>
                )
            }
        }, 
        {
            title: "Patient Id", 
            render: (text, record) => {
                return(
                    <div style={{
                        fontWeight: 700
                    }}>
                        {record?.patient_id}
                    </div>
                )
                
            }
        }, 
        {
            title: "Patient Name",
            dataIndex: "patient_name"
        }, 
        {
            title: "Modality", 
            dataIndex: "modality", 
            render: (text, record) => {
                return(
                    <div style={{
                        fontWeight: 600
                    }}>
                        {text}
                    </div>
                )
            }
        }, 
        {
            title: "Uploaded At", 
            render: (text, record) => {
                return(
                    <div>
                        {moment(record?.created_at).format("DD/MM/YYYY HH:mm:ss")}
                    </div>
                )
            }
        }
    ]

    // Fetch upload history related data information
    const {data: studyUploadHistory, isLoading: isStudyHistoryLoading} = useQuery({
        queryKey: ["get", "study", "history", currentPage], 
        queryFn: async () => {
            const response = await getUserUploadHistoryRequest({
                page_number: currentPage,
                page_size: PAGE_SIZE_LIMIT
            }); 
            return response
        }
    })

    return (
        <div className="study-upload-history-div">
            <div className="study-upload-history-title">
                Your Upload History
            </div>
            <div className="study-upload-history-table">
                <Table
                    columns={columns}
                    dataSource={studyUploadHistory?.data ?? []}
                    className="cloudimts-uploader-table"
                    loading = {isStudyHistoryLoading}
                    locale={{
                        emptyText: (
                            <Empty
                                description = {"No study history found"}
                            />
                        )
                    }}
                    pagination = {{
                        current: currentPage, 
                        pageSize: PAGE_SIZE_LIMIT, 
                        total : studyUploadHistory?.total_object ?? 10, 
                        onChange : (page) => setCurrentPage((page)), 
                        showSizeChanger: false
                    }}
                />
            </div>
        </div>
    )
}
export default StudyUploadHistory ; 
