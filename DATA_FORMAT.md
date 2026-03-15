# 数据格式说明

## 打卡记录 JSON 格式

打卡记录存储在 `checkins/YYYY-MM-DD.json` 文件中，每个文件包含当天的所有打卡记录。

### 格式说明

```json
{
  "date": "2026-03-15",
  "users": [
    {
      "github": "username",
      "content": "学习内容描述",
      "images": ["图片URL1", "图片URL2"],
      "timestamp": "2026-03-15T10:30:00.000Z"
    }
  ]
}
```

### 字段说明

- **date**: 打卡日期，格式为 YYYY-MM-DD
- **users**: 用户打卡记录数组
  - **github**: GitHub 用户名
  - **content**: 学习内容文本
  - **images**: 上传的图片 URL 数组
  - **timestamp**: 打卡时间戳（ISO 8601 格式）

### 设计理由

1. **按日期组织文件**: 便于按日期查询和管理打卡记录
2. **支持多用户**: 每天可以有多个用户打卡
3. **图片独立存储**: 图片存储在 assets/images 目录，JSON 中只保存 URL
4. **时间戳记录**: 便于追踪打卡顺序和统计连续打卡
5. **JSON 格式**: 易于解析和处理，支持版本控制

## 用户资料 Markdown 格式

用户资料存储在 `users/{username}.md` 文件中。

### 格式说明

```markdown
# username

## Stats

Total Check-ins: 12
Current Streak: 5 days
Longest Streak: 10 days

## History

### 2026-03-15

今天学习了 React Hooks 的使用方法。

![学习截图](https://raw.githubusercontent.com/owner/repo/main/assets/images/2026-03-15-abc123.png)

### 2026-03-14

学习了 TypeScript 类型系统。
```

### 字段说明

- **Total Check-ins**: 总打卡次数
- **Current Streak**: 当前连续打卡天数
- **Longest Streak**: 最长连续打卡天数
- **History**: 按日期倒序排列的打卡历史
