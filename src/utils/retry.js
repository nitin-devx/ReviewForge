import * as core from "@actions/core";



/**retry  if  anythings fails  { async function   with exponential backoff    first try  1s 
           second try 2s
           third try 4s
           and so on
           */


export async function withRetry(fn, { maxAttempts = 3, baseDelayMs = 1000 } = {}) {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const isRetrayable = isRetryableError(error);
            if (!isRetrayable || attempt === maxAttempts) {
                throw error;
            }
            const delay = baseDelayMs * Math.pow(2, attempt - 1);
            core.warning(`Attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`);
            await sleep(delay);
        }
    }
    throw lastError;
}


function isRetryableError(error) {
    // OpenAI-style: error.status is a number
    const httpStatus = error?.status ?? error?.error?.code;

    if (typeof httpStatus === 'number') {
        if (httpStatus === 429 || httpStatus >= 500) return true;
    }

    // Gemini-style: error.error.status is a string like "UNAVAILABLE"
    const statusString = error?.error?.status;
    const retryableStatusStrings = ['UNAVAILABLE', 'RESOURCE_EXHAUSTED', 'INTERNAL'];

    if (typeof statusString === 'string' && retryableStatusStrings.includes(statusString)) {
        return true;
    }

    return false;
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}