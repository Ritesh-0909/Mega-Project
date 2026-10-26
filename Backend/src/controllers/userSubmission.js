const Problem = require("../modules/problem");
const Submission = require("../modules/submission");
const {getLanguageById, submitBatch, submitToken} = require("../utils/ProblemUtility");

const submitCode = async(req,res)=>{
    let submittedResult;
    try{
        const userId = req.result._id;
        const problemId = req.params.id;
        
        let {code, language} = req.body;

        if (!code?.trim() || !language || !problemId) {
            return res.status(400).json({
            error: "Code, language, and problem ID are required."
            });
        }

        if(language==='cpp')
            language='c++'

        // Fetch the problem from database
        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({ error: "Problem not found." });
        }
        // Testcases(Hidden)
        // Sabse pahle hum apne submission ko store karenge DB me
        const languageId = getLanguageById(language);

        if (!languageId) {
            return res.status(400).json({ error: "Unsupported programming language." });
        }
        submittedResult = await Submission.create({
            userId,
            problemId,
            code,
            language,
            status:'pending',
            testCasesTotal:problem.hiddenTestCases.length
        });
    
    // Judge0 ko code submit karna hai 
    const submissions = problem.hiddenTestCases.map((testcase)=>({
        source_code: code,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output
    }));    

    const submitResult = await submitBatch(submissions);
    if (!Array.isArray(submitResult) ||
    submitResult.length !== submissions.length ||
    submitResult.some((item) => !item.token)) {
        throw new Error("Judge0 did not return valid submission tokens.");
    }

    const resultToken = submitResult.map((item)=>item.token);

    const testResult = await submitToken(resultToken);

    if (!Array.isArray(testResult) ||
    testResult.length !== submissions.length) {
        throw new Error("Could not retrieve all Judge0 test results.");
    }

    // submittedResult ko update karo
    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let status = 'accepted';
    let errorMessage = null;

    for(const test of testResult){
        if(test.status_id==3){
            testCasesPassed++;
            runtime = runtime+parseFloat(test.time) || 0;
            memory = Math.max(memory,Number(test.memory)||0);
            continue;
        }
        // Compilation Error (Judge0 status 6)
        if (test.status_id === 6) {
            status = "error";
            errorMessage =
            test.compile_output ||
            test.stderr ||
            "Compilation error.";
            break;
        }
        // Wrong Answer (Judge0 status 4)
        if (test.status_id === 4) {
            if (status !== "error") {
                status = "wrong";
                errorMessage = errorMessage || "Wrong Answer.";
            }
            continue;
        }
        // Runtime error
        if ([7, 8, 9, 10, 11, 12, 13].includes(test.status_id)) {
            status = "error";
            errorMessage =
            test.stderr ||
            test.message ||
            test.status?.description ||
            "Your program failed during execution.";
            break;
        }

        // Time limit, memory limit, or other non-accepted status
        status = "error";
        errorMessage =
        errorMessage ||
        test.message ||
        test.stderr ||
        test.compile_output ||
        test.status?.description ||
        "Execution failed.";
        break;
        }

    // Store the result in Database
    submittedResult.status = status;
    submittedResult.testCasesPassed = testCasesPassed;
    submittedResult.errorMessage = errorMessage;
    submittedResult.runtime = runtime;
    submittedResult.memory = memory;

    await submittedResult.save();


    // Mark the problem solved only when all test cases are accepted.
    if (
      status === "accepted" &&
      !req.result.problemSolved.some(
        (id) => id.toString() === problemId
      )
    ) {
      req.result.problemSolved.push(problemId);
      await req.result.save();
    }

    return res.status(201).json({
      accepted: status === "accepted",
      status,
      error: errorMessage,
      totalTestCases: submittedResult.testCasesTotal,
      passedTestCases: testCasesPassed,
      runtime,
      memory
    });
  } catch (err) {
    console.error("Error in submitCode:", err);

    // Mark the saved submission as failed if processing failed.
    if (submittedResult) {
      try {
        submittedResult.status = "error";
        submittedResult.errorMessage =
          err.message || "Submission processing failed.";
        await submittedResult.save();
      } catch (saveError) {
        console.error("Could not update submission:", saveError);
      }
    }

    return res.status(500).json({
      error: err.message || "Internal server error while submitting code."
    });
  }
};

const runCode = async(req,res)=>{
    try{
        const userId = req.result._id;
        const problemId = req.params.id;
        
        let {code, language} = req.body;

        if (!userId || !code?.trim() || !problemId || !language) {
            return res.status(400).json({
                success: false,
                error: "Code, language, and problem ID are required.",
                testCases: []
            });
        }
        if (language === "cpp") {
            language = "c++";
        }

        // Fetch the problem from database
        const problem = await Problem.findById(problemId);

        if (!problem) {
            return res.status(404).json({
                success: false,
                error: "Problem not found.",
                testCases: []
            });
        }
    
    // Judge0 ko code submit karna hai 
    const languageId = getLanguageById(language);

    if (!languageId) {
        return res.status(400).json({
        success: false,
        error: "Unsupported programming language.",
        testCases: []});
    }

    const submissions = problem.visibleTestCases.map((testcase)=>({
        source_code:code,
        language_id:languageId,
        stdin:testcase.input,
        expected_output:testcase.output
    }));    

    if (submissions.length === 0) {
        return res.status(400).json({
            success: false,
            error: "No visible test cases are configured for this problem.",
            testCases: []
        });
    }

    const submitResult = await submitBatch(submissions);

    if (
        !Array.isArray(submitResult) ||
        submitResult.length !== submissions.length ||
        submitResult.some((item) => !item.token)
    ) {
        throw new Error("Judge0 did not return valid submission tokens.");
    }

    const resultToken = submitResult.map((value)=>value.token);

    const testResult = await submitToken(resultToken);

    if (
        !Array.isArray(testResult) ||
        testResult.length !== submissions.length
    ) {
        throw new Error("Could not retrieve all Judge0 test results.");
    }

    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0 ;

    const testCases = testResult.map((test, index) => {
        const statusId = test.status?.id ?? test.status_id;

        if(statusId==3){
            testCasesPassed++;
            runtime += Number(test.time) || 0;
            memory = Math.max(memory,Number(test.memory)||0);
        }
        let error = null;

        if (statusId === 4) {
            error = "Wrong Answer";
        } else if (statusId === 5) {
            error = "Time Limit Exceeded";
        } else if (statusId === 6) {
            error = test.compile_output || "Compilation Error";
        } else if ([7, 8, 9, 10, 11, 12].includes(statusId)) {
            error = test.stderr ||
            test.message ||
            test.status?.description ||
            "Runtime Error";
        } else if (statusId === 13) {
            error = test.message ||
            test.status?.description ||
            "Judge0 Internal Error";
        } else if (statusId !== 3) {
            error = test.message ||
            test.stderr ||
            test.compile_output ||
            test.status?.description ||
            "Execution failed";
        }

        return {
            stdin: submissions[index].stdin,
            expected_output: submissions[index].expected_output,
            stdout: test.stdout ?? null,
            stderr: test.stderr ?? null,
            compile_output: test.compile_output ?? null,
            message: test.message ?? null,
            status_id: statusId,
            status: test.status?.description || "Unknown",
            error,
            time: test.time ?? null,
            memory: test.memory ?? null
        };
    });

        // 8. Determine overall result
        const success = testCases.every(
            (test) => test.status_id === 3
        );

        const firstFailedTest = testCases.find(
            (test) => test.status_id !== 3
        );

        // 9. Return detailed results to frontend
        return res.status(200).json({
            success,
            error: firstFailedTest?.error || null,
            passedTestCases: testCasesPassed,
            totalTestCases: testCases.length,
            runtime,
            memory,
            testCases
        });

    } catch (err) {
        console.error(
            "Error in runCode:",
            err.response?.data || err.message || err
        );

        return res.status(500).json({
            success: false,
            error: "Code execution failed because of a server error.",
            details: err.response?.data || err.message,
            testCases: []
        });
    }
};

module.exports = { submitCode, runCode };


