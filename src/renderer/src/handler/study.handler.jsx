// ***** Orthanc related configuration **** // 

const ORTHANC_URL = "http://127.0.0.1:8042/"


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