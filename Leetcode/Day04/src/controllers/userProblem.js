const {getLanguageById, submitBatch} = require("../utils/ProblemUtility");

const CreateProblem = async(req,res)=>{
    const { title, description, difficulty, tags,
        visibleTestCases,hiddenTestCases,startCode,
        referenceSolution,problemCreator
    } = req.body;

    try {
        for(const {language,completeCode} of referenceSolution){

            // source_code:
            // language id:
            // stdin:
            // expectedOutput:
            const languageId = getLanguageById(language);

            // I am creating Batch submission
            const submissions = visibleTestCases.map((input,output)=>({
                source_codde:completeCode,
                language_id:languageId,
                stdin:input,
                expected_output:output
            }));

            const submitResult = await submitBatch(submissions);
        }    
    } 
    catch (err){

    }
}