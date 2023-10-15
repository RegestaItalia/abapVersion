
import { getOctokit, context as githubContext } from "@actions/github";
import { XMLParser } from "fast-xml-parser";

export type ActionArgs = {
    githubToken: string,
    repoFullName?: string,
    repoBranch?: string
};

export async function getVersion(data: ActionArgs) {
    const githubToken = data.githubToken;
    const octokit = getOctokit(githubToken);

    var owner;
    var repo;

    if (data.repoFullName) {
        const aSplit = data.repoFullName.split('/');
        if (aSplit.length !== 2) {
            throw new Error('Cannot parse full repo name');
        } else {
            owner = aSplit[0];
            repo = aSplit[1];
        }
    } else {
        owner = githubContext.repo.owner;
        repo = githubContext.repo.repo;
    }

    const branch = data.repoBranch || githubContext.ref;

    //search .abapgit.xml
    var jObj: any;
    try {
        const fileData = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}?ref={ref}', {
            owner,
            repo,
            path: '.abapgit.xml',
            ref: branch,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });
        const base64Xml = (fileData.data as any).content;
        const rawXml = atob(base64Xml);
        const parser = new XMLParser();
        jObj = parser.parse(rawXml);
    } catch (e) {
        throw new Error('.abapgit.xml was not found.');
    }

    var versionObj;
    var versionObjVar;

    try {
        const versionConstant = jObj['asx:abap']['asx:values']['DATA']['VERSION_CONSTANT'];
        const aSplit = versionConstant.split('=>');
        if (aSplit.length === 2) {
            versionObj = aSplit[0];
            versionObjVar = aSplit[1];
        } else {
            throw new Error();
        }
    } catch (e) {
        throw new Error('Version constant not found in .abapgit.xml');
    }

    var trees = [branch];
    var tree = [];

    do {
        const tree_sha = trees[0];
        trees = trees.filter(tree => tree !== tree_sha);
        const treeResponse = await octokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', {
            owner,
            repo,
            tree_sha,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });
        tree = tree.concat(treeResponse.data.tree.filter(o => o.type !== 'tree'));
        trees = trees.concat(treeResponse.data.tree.filter(o => o.type === 'tree').map(o => o.sha));
    } while (trees.length > 0);

    var fileUrl;
    const fileRegex = new RegExp(`${versionObj}.(intf|clas).abap$`, 'gmi');
    for (const o of tree) {
        if (fileRegex.test(o.path)) {
            fileUrl = o.url;
            break;
        }
    }
    if (!fileUrl) {
        throw new Error('Source file not found.')
    }

    const sourceFileData = await octokit.request(`GET ${fileUrl}`);
    const base64SourceCode = (sourceFileData.data as any).content;
    const rawSourceCode = atob(base64SourceCode);

    const variableRegex = new RegExp(`(?:CONSTANTS|CLASS-DATA)\\s*${versionObjVar}\\s*.*'(.*)'`, 'gmi');
    const res = variableRegex.exec(rawSourceCode);
    if(res){
        return res[1];
    }else{
        throw new Error(`Couldn't find variable "${versionObjVar}" value.`);
    }
}