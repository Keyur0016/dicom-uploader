import apiHandler from "./apiHandler";

const userLoginRequest = async ({payload}) => {
    return apiHandler.post( "/owner/v1/login", payload)
}
export {userLoginRequest} ; 

const userInformationRequest = async ({payload, params}) => {
    return apiHandler.post("/owner/v1/user_details_fetch", payload, params) ; 
}
export {userInformationRequest} ; 