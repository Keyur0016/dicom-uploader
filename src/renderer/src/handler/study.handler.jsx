// ***** Orthanc related configuration **** // 
export const ORTHANC_URL = "http://127.0.0.1:8042/"

const fetchStudyList = async () => {
    const response = await fetch(`${ORTHANC_URL}studies`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });
    return response.json() ; 
}

export {fetchStudyList} ; 

const fetchParticularStudyInfoRequest = async(studyid) => {
    const response = await fetch(`${ORTHANC_URL}/studies/${studyid}?requestedTags=ModalitiesInStudy;NumberOfStudyRelatedInstances;NumberOfStudyRelatedSeries`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }) ; 
    return response.json() ; 
}

export {fetchParticularStudyInfoRequest} ; 

const fetchParticularStudySeriesInfoRequest = async (studyId) => {
    const response = await fetch(`${ORTHANC_URL}/studies/${studyId}/series`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }) ; 
    return response.json() ; 
}

export {fetchParticularStudySeriesInfoRequest} ; 

const deleteParticularStudyRequest = async (studyId) => {
    const response = await fetch(`${ORTHANC_URL}/studies/${studyId}`, {
        method: "DELETE", 
        headers: {
            "Content-Type": "application/json"
        }
    }) ; 
    return response.json()
}

export {deleteParticularStudyRequest} ; 

const studyBackupStartRequest = async (studyId) => {
    const response = await fetch(`${ORTHANC_URL}/studies/${studyId}/archive`, {
        "method": "POST", 
        headers: {
            "Content-Type": "application/json"
        }, 
        body: JSON.stringify({
            "Asynchronous": true,
            "Priority": 0,
            "Synchronous": false,
        })
    }) ; 
    let data = await response.json() ; 
    return data
}
export {studyBackupStartRequest} ; 


const checkJobStatusRequest = async (jobid) => {
    let response = await fetch(`${ORTHANC_URL}/jobs/${jobid}`, {
        "method": "GET", 
        headers: {
            "Content-Type": "application/json"
        }
    }); 

    response = await response.json() ; 
    return response ; 
}

export {checkJobStatusRequest} ; 

const restartOrthancServerRequest = async () => {
    let response = await fetch(`${ORTHANC_URL}tools/reset`, {
        method: "POST", 
        headers: {
            "Content-Type": "application/json"
        }
    }); 
    return response ; 
}
export {restartOrthancServerRequest}

const configureOrthancPeerRequest = async (payload) => {
    let response = await fetch(`${ORTHANC_URL}/peers/${payload.orthanc_peer}`, {
        method: "PUT", 
        headers: {
            "Content-Type": "application/json"
        }, 
        body: JSON.stringify({
            "Url": payload.orthanc_url, 
            "Username": payload.orthanc_username, 
            "Password": payload.orthanc_password
        })
    }) ; 
    return response ;  
}
export {configureOrthancPeerRequest} ;