/**
 * gitHooks
 * @description git commit后触发该 githook, 自动将当前分支合并到指定分支上，并 push 到 origin
 * *****注意：目标分支建议如下设置*****
 * 开发阶段可设置为： test_92
 * 预发布阶段可设置为：test_92和 preRelease 
 * @argv 接收的参数表示自定义需要将当前分支合并到哪些分支上
 * 
 * @warn 如果工作分支为 master 则不做处理
 */
const simpleGit = require('simple-git/promise')();
const chalk = require('chalk')

let targetBranchArray=[] 
let argv=process.argv.slice(2)
if (argv.length == 0 ){
  console.log(chalk.red('执行参数不能为空！请设置目标分支！'));
  return
}
targetBranchArray = Array.from(new Set(argv)) 

/**
 *  执行异步任务，并模拟进度提示
 * @param {string} logMsg 
 * @param  {...any} funcParaArray 
 */
async function doJobWithProgress(logMsg, ...funcParaArray){
  if(typeof this != 'function'){
    throw 'doJobWithProgress 只能用于执行异步方法'
  }
  
  console.log(logMsg)
  let countTimer = 0;
  const delay = 500;
  let fd = setInterval(() => {
    process.stdout.write('.')
    countTimer += delay
    if(countTimer >= delay*60*20) { //10 minute
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
       console.log(chalk.red(`合并${workBranch}到${targetBranch}出错`))
       throw error
    }
}

async function task_push(){
  let options=['-v', 'origin']

  targetBranchArray.forEach(targetBranch => {
    let src_dist=`refs/heads/${targetBranch}` //推送到 targetBranch 关联的分支，所以可以胜率 dest
    options.push(src_dist)
  })

  try {
    await doJobWithProgress.call(simpleGit.push, 
      chalk.green(`push分支:${targetBranchArray}到origin`), ...options)
  } catch (error){
    console.log(chalk.red(`push分支${targetBranchArray}到origin出错`))
    throw error
  }
}
async function main() {
  let needStash = false
  try {
    const branchSummaryLocal = await simpleGit.branchLocal()
    let workBranch = branchSummaryLocal.current; //当前工作分支

    /** master分支与目标分支上的操作不触发自动合并提交流程 */
    let ignoreBranchs = targetBranchArray.concat('master')
    let isTrue = ignoreBranchs.some((branch) => {
      return workBranch === branch  
    }) 
    if (isTrue){
      console.log(chalk.red(`${workBranch}分支操作不会执行自动合并`))
      return
    }

    console.log(chalk.cyan(`>>>开始自动合并，当前工作分支：${workBranch}`))
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
     * 2. 合并当前工作分支到 目标分支
     * 2.1 合并前，必须要切换到目标分支(保存场景：1、当前工作分支)
    */
   for(let targetBranch of targetBranchArray) {
    await task_merge(workBranch, targetBranch)
   }

    await task_push()

    if(needStash && await simpleGit.stash('show')){
      await simpleGit.stash(['pop'])
      console.log(chalk.green(`在${workBranch}分支上执行 git-stash pop 操作`))
    }
    console.log(chalk.cyan(`>>>finshed, enjoy coding!`))
  } catch (error) {
    console.log(chalk.red(`${error}`))
    if(needStash && await simpleGit.stash('show')){
      await simpleGit.stash(['pop'])
      console.log(chalk.green(`执行回滚操作......done!`))
    }
  }
}

  main()