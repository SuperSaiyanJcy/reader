# 第三方组件

Reader 原创代码遵循 MIT 许可证。下列依赖保留各自许可证，不能用项目许可证替代其声明。

| 组件 | 许可证 | 用途 |
| --- | --- | --- |
| Electron | MIT；Chromium 另附第三方声明 | 桌面运行时 |
| React / React DOM | MIT | 界面渲染 |
| TanStack Virtual | MIT | 长文本虚拟渲染 |
| iconv-lite | MIT | 文本编码转换 |
| jschardet | 0BSD | 编码探测 |
| Lucide | ISC | 界面图标 |

运行 `npm run notices` 可根据 `package-lock.json` 更新 [生产依赖许可证正文](resources/THIRD_PARTY_NOTICES.txt)，其中也保留传递依赖的声明。构建命令自动执行这一过程，打包时将该文件及 Reader 自身许可证一并放入应用资源目录。

Electron 分发包中的 `LICENSE` 和 `LICENSES.chromium.html` 等文件继续随运行时保留。开发工具的许可见对应 npm 包。

应用图标与内置示例文本为项目原创。界面截图仅展示内置示例；项目不附带第三方小说或字体。Word / Microsoft Word 是其权利人的商标，项目与 Microsoft 无隶属关系。
