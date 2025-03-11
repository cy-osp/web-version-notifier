# VersionChecker

一个 JavaScript 工具类，用于监听 HTML 页面内容变化，并在检测到更新时触发回调函数。它使用 `visibilitychange` 事件，在页面可见时检查更新。

## 安装

无需安装，只需在项目中引入 `VersionChecker` 类。

## 使用方法

### 引入类

将 `VersionChecker` 代码复制到你的 JavaScript 项目中。

### 示例

```javascript
const checker = new VersionChecker(
  'https://example.com/version.html', // 需要检测的 URL
  /version:\s*(\d+\.\d+\.\d+)/,   // 用于提取版本号的正则表达式
  () => { console.log('检测到新版本！'); } // 版本更新时执行的回调函数
);
```

### 构造函数参数

| 参数       | 类型            | 说明                                                         |
| ---------- | --------------- | ------------------------------------------------------------ |
| `htmlUrl`  | `string`        | 需要检测的 HTML 页面 URL。                                   |
| `reg`      | `RegExp` (可选) | 用于提取 HTML 内容中特定部分的正则表达式,例如版本号或者某个静态文件hash值 |
| `callback` | `function`      | 当检测到变更时执行的回调函数，比如可以弹窗提醒用户刷新页面   |

## 方法

### `destroy()`

停止监听更新。

```javascript
checker.destroy();
```

## 工作原理

1. 获取指定 `htmlUrl` 的内容。
2. 使用提供的 `reg`（如果有）提取特定内容。
3. 存储获取的内容，并监听页面可见性变化。
4. 当页面重新可见时，再次获取内容。
5. 如果新获取的内容与之前存储的内容不同，则执行回调函数。

## 注意事项

- `fetch` 使用 `cache: 'no-store'` 确保每次获取的内容都是最新的。
- 通过 `document.visibilityState` 仅在页面可见时检查，优化性能。
- 若获取数据时发生错误，会在控制台打印错误信息。
- 确保 `htmlUrl` 可访问，并返回符合预期的数据。

## 许可协议

MIT