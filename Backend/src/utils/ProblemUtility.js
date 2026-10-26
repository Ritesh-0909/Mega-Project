const axios = require("axios");

const getLanguageById =(lang)=>{
    const language ={
        "c++":54,
        "java":62,
        "javascript":63
    }

    return language[lang.toLowerCase()];
}

const decodeBase64 = (value) => {
    if (!value) return null;
    return Buffer.from(value, "base64").toString("utf8");
};

const submitBatch = async (submissions)=>{

    const options ={
        method:'POST',
        url: 'http://localhost:2358/submissions/batch',
        params:{
            base64_encoded:'false'
        },
        headers:{
            "Content-Type": "application/json"
        },
        data: {
            submissions
        }    
    };

    try{
        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        console.error(
            "Judge0 submission error:",
            error.response?.data || error.message
        );

        throw error;
    }
};

const submitToken = async(resultToken)=>{
    const options = {
        method: 'GET',
        url: 'http://localhost:2358/submissions/batch',
        params: {
        tokens: resultToken.join(","),
        base64_encoded: 'true',
        fields: '*'
    }
};


while (true) {
        try {
            const response = await axios.request(options);
            const submissions = response.data?.submissions;

            if (!Array.isArray(submissions)) {
                throw new Error(
                    "Invalid response received from Judge0."
                );
            }

            const isResultObtained = submissions.every((test) => {
                const statusId = test.status?.id ?? test.status_id;
                return statusId !== undefined && statusId > 2;
            });

            if (isResultObtained) {
                return submissions.map((test) => ({
                    ...test,
                    status_id: test.status?.id ?? test.status_id,
                    stdout: decodeBase64(test.stdout),
                    stderr: decodeBase64(test.stderr),
                    compile_output: decodeBase64(test.compile_output),
                    message: decodeBase64(test.message)
                }));
            }

            await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(
                "Judge0 polling error:",
                error.response?.data || error.message
            );

            throw error;
        }
}
};

module.exports = {
    getLanguageById,
    submitBatch,
    submitToken
};


