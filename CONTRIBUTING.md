# 参与贡献

欢迎提交问题、改进文档和发起 Pull Request。请先查看 [README](README.md) 和 [设计说明](docs/设计说明.md)。

## 本地开发

需要 Node.js 24 和 npm。在 macOS 或 Windows 上执行：

```sh
git clone git@github.com:SuperSaiyanJcy/reader.git
cd reader
npm ci
npm run dev
```

测试与构建：

```sh
npm test
npm run test:e2e
npm run build
```

端到端测试会启动真实 Electron 窗口，在系统临时目录创建独立数据，不读取开发者的阅读记录。字体测试使用操作系统自带字体，不向仓库提交字体文件。测试需要桌面会话；无界面的 Linux 环境不能直接运行该流程。

## 提交前检查

- 说明具体场景、原有问题和修改后的行为。
- 改动阅读逻辑时，检查 TXT 编码、目录定位、续读与长段落是否丢字。
- 改动排版时，检查连续纸张接缝、章节间距及两行重叠翻读。
- 只为实际行为补充有意义的测试，保持代码、界面与文档一致。
- 不提交个人小说、阅读记录、字体副本、私钥、令牌、构建输出和测试报告。

## 问题反馈

通过 [Issues](https://github.com/SuperSaiyanJcy/reader/issues) 描述系统版本、CPU 架构、Reader 版本、操作步骤和实际结果。排版问题请同时说明字体、字号、行距及缩放。

如需提供 TXT 或字体复现问题，请使用自己编写的少量文本或可再分发的字体，并删去个人路径与其他隐私信息。
