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

    const statusSummary = await simpleGit.status()
    console.log(statusSummary)
    /**
     * 1. stash 如果存在未 add 代码，则stash当前未提交部分
     */
    // if(statusSummary)
    // await simpleGit.stash()


    /** 
     * 1_end. stash pop最新一次 stash
    */
  //  if(!!simpleGit.stash['show']){
  //     await simpleGit.stash(['pop'])
  //  }
  

    /** 合并当前分支到 92Test */
    // gitMerge('master', '92Test')
    // gitMerge('master', '92Test')
    // console.log(branchResult)
  }
)()

/**问题 1：如何处理部分提交的场景，需要 stash 之后，再讲当前分支合并？
 * simpleGit
 */
