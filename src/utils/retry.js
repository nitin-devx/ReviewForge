import * as core from "@actions/core";



/**retry  if  anythings fails  { async function   with exponential backoff    first try  1s 
           second try 2s
           third try 4s
           and so on
           */    


export async function withRetry(fn,{maxAttempts =3 ,baseDelayMs=1000}={}){
    let lastError;

    for(let attempt =1 ;attempt<=maxAttempts ; attempt++){
        try{
            return await fn();
        }catch(error){
            lastError =error;


            const isRateLimit = error?.status ===429;
            const isServerError = error?.status ===500;
            const isRetryable= isRateLimit || isServerError;

            if(!isRetryable || attempt === maxAttempts){
                throw error;
            }


            const delay = baseDelayMs * Math.pow(2,attempt -1);
            core.warning(`Attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`);
            await sleep(delay);
        }
    }
    throw lastError;
}



function sleep(ms){
    return new Promise (resolve=>setTimeout(resolve,ms));
}