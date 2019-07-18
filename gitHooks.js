const simpleGit = require('simple-git/promise')();

function gitMerge(from, to){
  simpleGit.mergeFromTo(from, to).then(result=>{
    console.log(result)
  }, error=>{
    console.log(error)
  })
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
    // gitMerge('master', '92Test')
    // console.log(branchResult)
  }
)()

