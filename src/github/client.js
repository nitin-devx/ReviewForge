import * as core from '@actions/core'
import * as github from '@actions/github'


/** 
 * @param {string} token
 * @return {import('@actions/github').getOctokit}
*/

export function createGithubClient(token){
    if(!token){
        throw new Error('github token is required to create API client')
    }
    core.debug('Github client initialised');
    return github.getOctokit(token)
}