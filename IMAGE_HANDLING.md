# 图片处理功能说明

## 实现概述

图片处理功能已在 `web/src/githubApi.ts` 中实现，包含以下核心功能：

### 1. 图片转换为 Base64

```typescript
private fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

**说明**：
- 使用 FileReader API 读取图片文件
- 将图片转换为 Data URL 格式
- 提取 Base64 编码部分（去掉 `data:image/png;base64,` 前缀）

### 2. 上传图片到 GitHub

```typescript
async uploadImageToGithub(imageBase64: string, date: string): Promise<string> {
  const randomId = Math.random().toString(36).substring(2, 15);
  const fileName = `${date}-${randomId}.png`;
  const path = `assets/images/${fileName}`;

  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${this.config.owner}/${this.config.repo}/contents/${path}`,
    {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({
        message: `Upload image ${fileName}`,
        content: imageBase64,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to upload image: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content.download_url;
}
```

**说明**：
- 生成随机文件名：`{date}-{random}.png`
- 使用 GitHub REST API 上传图片
- 返回图片的下载 URL

### 3. 图片存储路径

图片存储在仓库的以下位置：
```
assets/images/{date}-{random}.png
```

**示例**：
- `assets/images/2026-03-15-abc123.png`
- `assets/images/2026-03-15-def456.png`

## 使用流程

1. **用户选择图片**
   - 在 Web 界面点击文件上传按钮
   - 选择一个或多个图片文件

2. **转换为 Base64**
   - 使用 `fileToBase64()` 方法将图片转换为 Base64 编码

3. **上传到 GitHub**
   - 调用 `uploadImageToGithub()` 方法上传图片
   - 图片保存到 `assets/images/` 目录
   - 获取图片的下载 URL

4. **保存 URL**
   - 将图片 URL 保存到打卡记录的 JSON 文件中
   - 格式：`["https://raw.githubusercontent.com/owner/repo/main/assets/images/2026-03-15-abc123.png"]`

## 优势

1. **无需外部存储**：直接使用 GitHub 仓库存储图片
2. **版本控制**：图片变更会被 Git 记录
3. **简单可靠**：利用 GitHub API 的稳定性和可靠性
4. **免费使用**：GitHub 提供免费的存储空间
5. **易于访问**：通过 raw.githubusercontent.com 直接访问图片

## 注意事项

1. **文件大小限制**：GitHub 单个文件最大 25MB
2. **仓库大小限制**：GitHub 仓库总大小限制为 1GB
3. **图片格式**：支持所有常见图片格式（PNG、JPG、GIF 等）
4. **并发上传**：当前实现为串行上传，可优化为并发上传
