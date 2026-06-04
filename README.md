# 轻记账微信小程序 MVP

这是一个基础账本 MVP，包含：

- 新增账单
- 查询月度明细
- 修改账单
- 删除账单

目录：

- `bill-book-backend`：Spring Boot + MySQL + MyBatis-Plus 后端
- `bill-book-miniprogram`：微信小程序原生前端

## 后端快速启动

进入后端目录：

```bash
cd bill-book-backend
```

先执行：

```sql
bill-book-backend/sql/schema.sql
```

然后修改：

```text
bill-book-backend/src/main/resources/application.yml
```

配置 MySQL 用户名和密码，再启动：

```bash
mvn spring-boot:run
```

接口地址：

```text
http://localhost:8080/api
```

核心接口：

```text
POST   /api/bills
GET    /api/bills/{id}
PUT    /api/bills/{id}
DELETE /api/bills/{id}
GET    /api/bills/month?year=2026&month=5
GET    /api/categories?type=EXPENSE
```

## 小程序启动

使用微信开发者工具打开：

```text
bill-book-miniprogram
```

前端请求地址配置在：

```text
bill-book-miniprogram/utils/request.js
```

默认：

```js
http://localhost:8080/api
```

开发阶段需要在微信开发者工具里勾选：

```text
不校验合法域名、web-view、TLS 版本以及 HTTPS 证书
```
