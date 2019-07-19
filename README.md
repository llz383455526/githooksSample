githooks设置示例

# 背景
公司开放平台项目有很多个模块，多个模块并行开发、并行测试、单独上线的场景是常态。但是由于配置、数据库以及一些历史问题，测试、预发布环境只能共用一个。
针对这种现象，我们规范了项目开发流程：

1. 旧流程
  功能分支走开发、测试、预发布、上线
  问题：分支开发者沟通不及时的时候，会导致线上代码相互覆盖---发布检测，未合并 master 代码禁止发布
1. 开发
  功能开发都基于 master 新建 feature 分支
1. 测试
  将进入测试阶段的 feature 分支合并到test分支，然后部署 test 分支进行测试
1. 预发布
  将进入预发布阶段的 feature 分支合并到 preRelease 分支，然后部署 preRelease 分支进行上线前验收
1. 上线
  将某个feature 分支进入上线阶段时，将 master 分支合并到改 feature 分支，然后使用该 feture 分支进行上线。上线成功后再讲 feature 分支合并到 master。
  **吐槽：** 聪明的你肯定能发现上线阶段可以简化为：将 feature A分支合并到 master 分支，然后上线。 但是，在我们这个环境下有一种场景会导致问题。前后端上线是独立的，前端合并 master 之后，由于后端问题或产品临时加/改需求，导致后端不能上线。此时如果有另外一个 feature B 上线就会把feature A的代码带到线上，由于feature A对应的后端未上线，导致系统出错。


  # 解决问题
  1. 问题 1： 测试环境、预发布环境 只有一个，并行测试、预发布存在瓶颈
    ```
    为测试环境、预发布环境设置专用发布分支：test、preRelease
    ```
  1. 问题 2：上线后忘记合并到 master
    jenkins 部署成功之后(release+npm run product)，合并开发分支到 master 并 push。并发送邮件
  1. 问题 3：频繁手动切换分支易出错
    愿景：
    开发者只需要在功能分支开发代码，功能完成后 push；push 环节执行 git hook，自动将开发分支合并到 test 和 preRelease 分支并 push
    引申问题：未达到测试标准的代码进入了测试和预发布流程
    实现：
    ```
    1、 功能分支开发完，执行 commit
    2、 commit 之后执行 post-commit 钩子
    3、 post-commit钩子执行 功能分支合并到 test和 preBuild 分支操作
    4、 用户手动 push，选择要将哪些分支 push 到 origin：测试阶段只push 功能分支和 test，预发布阶段 push 功能分支、test 和 preRelease 分支
    ```
  1. 问题 4：合并前更新当前分支比较耗时
    解决办法：先判断是否需要更新？
  1. 问题 5：git push 比较耗时，如果要合并到多个分支上会比较慢

# 实现方法
1. 直接使用 GIT_DIR/.hooks 里的钩子，通过 shell 来实现功能
2. 使用 nodejs 来编程实现（husky,[yorkie](https://github.com/yyx990803/yorkie))
