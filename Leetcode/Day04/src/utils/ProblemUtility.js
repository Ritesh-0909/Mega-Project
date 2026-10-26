const axios = require("axios");

const getLangugaeById =(lang)=>{
    const language ={
        "c++":54,
        "java":62,
        "javascript":63
    }

    return language[lang.toLowerCase()];
}

const submitBatch = async (submissions)=>{

    const options ={
        method:'POST',
        url: 'http://localhost:2358/submissions/batch',
        params:{
            base64_encoded:'true'
        },
        headers:{
            "Content-Type": "application/json"
        },
        data: {
            submissions
        }    
    };

    async function fetchData() {
    try {
        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        console.error(error);
    }
}
return await fetchData(); 
}

module.exports = {getLangugaeById, submitBatch};