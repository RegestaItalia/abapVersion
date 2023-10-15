import * as core from "@actions/core";
import { getVersion } from "./getVersion";

getVersion({
    githubToken: core.getInput('token'),
    repoFullName: core.getInput('repoFullName'),
    repoBranch: core.getInput('branch')
}).then((version) => {
    core.setOutput('version', version);
}).catch(err => {
    core.setFailed(err.message);
});