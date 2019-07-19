const simpleGit = require('simple-git/promise')();
const chalk = require('chalk')
/**
 * 将 workBranch 合并到 targetBranch 并 push
 * @param {*} workBranch 
 * @param {*} targetBranch 
 */
async function mergeAndPush(workBranch, targetBranch){
    // 检测 targetBranch 是否存在
    const branchSummary = await simpleGit.branch()
    if(!branchSummary.branches[targetBranch]) {
      console.log(chalk.red(`分支:${targetBranch}不存在！`))
      return
    }

    try {
      await simpleGit.checkout(targetBranch)
      let options=['--ff']  // fast-forward 合并
      options.push(workBranch)
      await simpleGit.merge(options)
      await simpleGit.push()
      await simpleGit.checkout(workBranch)
      console.log(chalk.green(`合并分支:${workBranch}到分支:${targetBranch}完成`));
     } catch (error) {
       console.log(`合并分支:${workBranch}到分支:${targetBranch}出错-->${error}`)
    }
}



  async function main() {
    let needStash = false
    try {
      const branchSummaryLocal = await simpleGit.branchLocal()
      let workBranch = branchSummaryLocal.current; //当前工作分支
      console.log(chalk.green(`>>>开始自动合并，当前工作分支：${workBranch}`))
      /** master 分支改变不做处理 */
      // if(branchSummaryLocal.current === "master"){
      //    console.log(chalk.red('master分支操作不会执行自动合并'))
      //   return
      // }

      /**
       * 1. stash 如果存在未 add/commit 代码，则stash当前未提交部分
       */
      const statusSummary = await simpleGit.status()
      
      if(statusSummary.files.length){
        needStash = true
        let stashResult = await simpleGit.stash()
        console.log(chalk.green(`发现未提交代码，执行stash-->:${stashResult}`));
      }

      /** 
       * 2. 合并当前工作分支到 92Test,preRelease
       * 2.1 合并前，必须要切换到目标分支(保存场景：1、当前工作分支)
      */
     
     await mergeAndPush(workBranch, '92Test')
     await mergeAndPush(workBranch, 'preRelease')
     if(needStash && await simpleGit.stash('show')){
        await simpleGit.stash(['pop'])
     }
     console.log(chalk.green(`工作分支已重置为${workBranch}, continue coding!`));
    
    } catch (error) {
      console.log(chalk.red(`出错：${error}`))
      if(needStash && !!simpleGit.stash['show']){
        await simpleGit.stash(['pop'])
     }
    }
  }

  main()