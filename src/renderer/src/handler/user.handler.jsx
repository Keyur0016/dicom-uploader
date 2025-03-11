import apiHandler from "./apiHandler";

const userLoginRequest = async ({payload}) => {
    return apiHandler.post( "/owner/v1/login", payload)
}
export {userLoginRequest} ; 

const userInformationRequest = async ({payload, params}) => {
    return apiHandler.post("/owner/v1/user_details_fetch", payload, params) ; 
}
export {userInformationRequest} ; 

const insertNewStudiesDataRequest = async (payload) => {
    return apiHandler.post("/studies/v1/insert_new_studies", payload) ; 
}
export {insertNewStudiesDataRequest} ; 

const insertStudyUploadTimeInfoRequest = async (payload) => {
    return apiHandler.post("/studies/v1/insert_study_time", payload) ; 
}
export {insertStudyUploadTimeInfoRequest} ; 
