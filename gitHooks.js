const simpleGit = require('simple-git/promise')();
const util = require('util');

function gitMerge(from, to){
  simpleGit.mergeFromTo(from, to)
}

(
  async function(){
    const branchResult = await Promise.all([simpleGit.branchLocal(),simpleGit.branch()]);
    let branchSummaryLocal = branchResult[0]
    let branchSummaryAll = branchResult[1]
  
    /** master 分支改变不做处理 */
    // if(branchSummaryLocal.current === "master"){
    //   return
    // }

    /** 合并当前分支到 92Test */
    // gitMerge('master', '92Test')
    console.log(await simpleGit.stash(['pop']))
    console.log(branchResult)
  }
)()

