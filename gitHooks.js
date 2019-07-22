/**
 * gitHooks
 * @description git commit后触发该 githook, 自动将当前分支合并到指定分支上（默认 92Test和 preRelease 分支），并 push 到 origin
 * @argv 接收的参数表示自定义需要将当前分支合并到哪些分支上
 * 
 * @warn 如果工作分支未 master 则不做处理
 */
const simpleGit = require('simple-git/promise')();
const chalk = require('chalk')

let targetBranchArray=['92Test', 'preRelease']
let argv=process.argv.slice(2)
if (argv.length >0 ){
  targetBranchArray = argv
}

/**
 *  执行异步任务，并模拟进度提示
 * @param {string} logMsg 
 * @param  {...any} funcParaArray 
 */
async function doJobWithProgress(logMsg, ...funcParaArray){
  if(typeof this != 'function'){
    throw new Error('doJobWithProgress 只能用于执行异步方法') 
  }
  
  console.log(logMsg)
  let countTimer = 0;
  const delay = 500;
  let fd = setInterval(() => {
    process.stdout.write('.')
    countTimer += delay
    if(countTimer >= delay*60*20) {
      clearInterval(fd)
    }
  }, delay)
  await this(funcParaArray)
  process.stdout.write('\n')
  clearInterval(fd)
}
/**
 * 将 workBranch 合并到 targetBranch 并 push
 * @param {*} workBranch 
 * @param {*} targetBranch 
 */
async function task_merge(workBranch, targetBranch){
    // 检测 targetBranch 是否存在
    const branchSummary = await simpleGit.branch()
    if(!branchSummary.branches[targetBranch]) {
      console.log(chalk.red(`分支:${targetBranch}不存在！`))
      return
    }

    try {
      await simpleGit.checkout(targetBranch)
      console.log(chalk.green(` >>>>准备合并到${targetBranch}分支`))
      console.log(chalk.green(`     切换本地分支为：${targetBranch}`))
      
    
      await doJobWithProgress.call(simpleGit.pull, 
        chalk.green(`     更新分支${targetBranch}到最新`))
      
      
      let options=['--ff']  // fast-forward 合并
      options.push(workBranch)
      await simpleGit.merge(options)
      
      await simpleGit.checkout(workBranch)
      console.log(chalk.green(` <<<<合并${workBranch}到${targetBranch}完成，工作分支已重置为${workBranch}`))
     } catch (error) {
       console.log(chalk.red(`合并${workBranch}到${targetBranch}出错-->${error}`))
       throw error
    }
}

async function task_push(){
  let options=['-v', 'origin']

  targetBranchArray.forEach(targetBranch => {
    let src_dist=`refs/heads/${targetBranch}` //推送到 targetBranch 关联的分支，所以可以胜率 dest
    options.push(src_dist)
  })

  simpleGit.push(options).then(() => {
    console.log(chalk.green(`----push分支:${targetBranchArray}到origin`))
  }).catch(error => {
    console.log(chalk.red(`----push分支${targetBranchArray}到origin出错：error`))
  })
}
async function main() {
  let needStash = false
  try {
    const branchSummaryLocal = await simpleGit.branchLocal()
    let workBranch = branchSummaryLocal.current; //当前工作分支
    console.log(chalk.cyan(`>>>开始自动合并，当前工作分支：${workBranch}`))
    /** master 分支改变不做处理 */
    // if(branchSummaryLocal.current === "master"){
    //    console.log(chalk.red('master分支操作不会执行自动合并'))
    //   return
    // }

    /**
     * 1. stash 如果存在未 add/commit 代码，则stash未提交部分
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
   for(let targetBranch of targetBranchArray) {
    await task_merge(workBranch, targetBranch)
   }

    task_push()

    if(needStash && await simpleGit.stash('show')){
      await simpleGit.stash(['pop'])
      console.log(chalk.green(`在${workBranch}分支上执行 git-stash pop 操作`))
    }
    console.log(chalk.cyan(`>>>finshed, enjoy coding!`))
  } catch (error) {
    if(needStash && await simpleGit.stash('show')){
      await simpleGit.stash(['pop'])
      console.log(chalk.red(`eroor：${error},执行回滚操作`))
    } else {
      console.log(chalk.red(`error：${error}`))
    }
  }
}

  main()