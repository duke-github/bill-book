# 账本微信小程序项目记忆文档

## 项目背景

本项目来自一次需求讨论：用户希望参考截图中的黄色记账类 App 风格，做一个微信小程序账本。第一版不做复杂功能，先完成基础闭环。

当前定位：

- 轻量个人账本
- 微信小程序原生前端
- Java 后端服务
- 本地可运行、易调试、方便后续改造

## 当前版本范围

V0.2 在基础功能上新增了交互优化和个性化功能：

基础功能（V0.1）：

- 新增账单
- 查询账单明细
- 修改账单
- 删除账单
- 按月汇总收入、支出
- 内置支出/收入分类
- 微信登录

V0.2 新增功能：

- 列表页滑到底部后连续上滑两次切换上一个月
- 收入和支出摘要区域可点击筛选，高亮选中类型
- 统计页面双击某月跳转至对应月份的账单详单
- 统计页面无数据的年份禁止切换，列表页无数据的月份同理
- 月度预算功能（与用户绑定，显示为"支出/预算"格式）
- 个性化设定 Tab 页（主题色、记账按钮颜色、每月预算设定）

暂不做：

- 多账本
- 家庭共享账本
- 图表统计（饼图/柱状图等）
- 资产账户
- OCR/自动识别账单
- Excel 导出
- 会员、广告、复杂运营功能

## 技术选型

后端：

- Spring Boot 3.3.5
- MySQL
- MyBatis-Plus 3.5.9
- Maven
- Java 17

前端：

- 微信小程序原生开发
- WXML
- WXSS
- JavaScript

当前不引入重型前端工程，也不使用 Redis。Redis 后续只有在登录态、统计缓存、限流等场景明确需要时再加。

## 当前目录

项目当前位于：

```text
E:\bill
```

主要目录：

```text
E:\bill\bill\bill-book-backend        后端工程
E:\bill\bill\bill-book-miniprogram    微信小程序工程
E:\bill\bill\README.md                运行说明
E:\bill\bill\docs\memory.md           当前记忆文档
```

## 后端功能

后端提供账单 CRUD、分类查询和预算管理。

核心接口：

```text
POST   /api/bills
GET    /api/bills/{id}
PUT    /api/bills/{id}
DELETE /api/bills/{id}
GET    /api/bills/month?year=2026&month=5
GET    /api/bills/available-months?year=2026
GET    /api/bills/available-years
GET    /api/categories?type=EXPENSE
GET    /api/budgets?year=2026&month=5
POST   /api/budgets
```

账单字段设计：

```text
id              账单ID
userId          用户ID
type            类型：EXPENSE 支出 / INCOME 收入
categoryCode    分类编码
categoryName    分类名称
amount          金额
remark          备注
recordDate      记账日期
createdAt       创建时间
updatedAt       更新时间
deleted          是否删除
```

预算字段设计（monthly_budget 表）：

```text
id              预算ID
userId          用户ID
year            年份
month           月份
amount          预算金额
createdAt       创建时间
updatedAt       更新时间
deleted         是否删除
```

实现约定：

- 支出和收入金额都存正数
- 通过 `type` 区分支出和收入
- 金额使用 `BigDecimal`
- 数据库金额字段使用 `decimal(12,2)`
- 删除使用逻辑删除，不物理删除
- 用户通过微信登录获取真实 userId

## 前端功能

小程序当前包含四个页面：

- 明细页（detail）
- 记账/编辑页（edit）
- 统计页（statistics）
- 个性化设定页（settings）

明细页：

- 默认展示当前月份
- 展示本月收入、本月支出（如设预算则显示"支出/预算"）
- 收入/支出摘要可点击筛选对应类型并高亮
- 按日期分组展示账单
- 滑到底部后连续上滑两次切换上一个月
- 无数据月份禁止切换，提示"没有更多数据了"
- 点击账单进入编辑页
- 长按账单可删除或调整日期

记账/编辑页：

- 支出/收入切换
- 分类选择
- 金额输入（自定义数字键盘）
- 备注输入
- 日期选择（支持前一天/后一天快捷切换）
- 新增保存
- 编辑保存
- 删除账单
- 离线记账（pending 队列，网络恢复后自动同步）

统计页：

- 按年汇总收入、支出、结余
- 月度明细表格
- 双击月份跳转至对应月份详单
- 无数据年份禁止切换，提示"该年份无数据"

个性化设定页（V0.2 新增）：

- 主题色选择（6 种预设色：薄荷绿、珊瑚红、薰衣草、天空蓝、蜜桃色、柠檬黄）
- 记账按钮颜色选择（5 种预设色）
- 每月预算设定（年月选择 + 金额输入）
- 主题设定保存在本地存储

底部导航栏（4 个 Tab）：

- 明细
- 记账（中间突出按钮）
- 统计
- 设定

## 内置分类

支出分类：

```text
餐饮、购物、零食饮料、交通、医疗、通讯、住房、学习、彩票、工作、娱乐开支、亲友、居家、娱乐、发红包、结婚、美容、礼金、快递、信用卡
```

收入分类：

```text
工资、红包、理财、兼职、礼金、其他
```

分类管理暂时不做，分类写死在前端和后端。

## 运行方式

后端：

```bash
cd E:\bill\bill\bill-book-backend
mvn spring-boot:run
```

MySQL 建表脚本（启动时自动建表，包括 monthly_budget 表）：

```text
E:\bill\bill\bill-book-backend\sql\schema.sql
```

数据库配置：

```text
E:\bill\bill\bill-book-backend\src\main\resources\application.yml
```

小程序：

使用微信开发者工具打开：

```text
E:\bill\bill\bill-book-miniprogram
```

前端接口地址配置：

```text
E:\bill\bill\bill-book-miniprogram\utils\request.js
```

开发阶段需要在微信开发者工具中勾选：

```text
不校验合法域名、web-view、TLS 版本以及 HTTPS 证书
```

## 后续建议

建议下一步按这个顺序推进：

1. 添加图表统计（饼图/柱状图展示分类占比）
2. 分类管理（自定义分类、排序、图标）
3. 多账本支持
4. Excel 导出
5. 数据备份与恢复

## 重要决策记录

- 第一版做 MVP，不追求功能大而全
- 先个人账本，不做多账本
- 先 MySQL，不加 Redis
- 先固定分类，不做分类管理
- 先本地联调，不处理正式 HTTPS 域名配置
- 后端按工程化方式保留 Controller、Service、Mapper、Entity 分层
- V0.2 新增预算功能，预算数据与用户绑定，存储在后端
- V0.2 主题色和按钮色保存在前端本地存储，不存后端
- V0.2 底部导航为自定义 4 Tab，不使用微信原生 tabBar
