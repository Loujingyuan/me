# 娄静远的个人网站

[查看网站](https://1340883027.github.io/Resume/) · [在线编辑内容](https://github.com/1340883027/Resume/edit/main/content.js) · [查看发布进度](https://github.com/1340883027/Resume/actions)

## 可视化编辑（推荐）

双击本地的 `editor.html`，或在预览网址末尾打开 `/editor.html`。上线后可以从[线上编辑器](https://1340883027.github.io/Resume/editor.html)进入。

1. 在“编辑栏目”里选个人介绍、教育背景、工作经历、科研项目、社会服务、兴趣爱好或社交链接。
2. 在表单中修改文字。用“新增条目”“上移”“下移”整理顺序。个人照片和项目配图均可直接从电脑选择，图片会压缩并随内容文件导出。
3. 对照“实时预览”查看效果。草稿保存在当前浏览器。点“保存内容文件”，将文件保存为网站目录中的 `content.js`。只支持下载的浏览器会导出文件，将下载的文件替换原文件即可。
4. 网站首次部署后，点“更新到 GitHub”，下载 `content.js`，在随后打开的 GitHub 上传页提交同名文件到 `main`。提交需要有仓库写入权限的 GitHub 账号。

## 直接修改内容文件

1. 打开上面的“在线编辑内容”，使用有仓库写入权限的 GitHub 账号登录。
2. 在 `content.js` 中找到相应栏目。个人介绍在 `intro`，教育在 `education`，工作在 `work`，科研在 `projects`，社会服务在 `service`，爱好在 `interests`，社交链接在 `social`。
3. 修改双引号内的文字。新增经历时复制一条完整记录，按希望展示的次序排列，用英文逗号分隔记录。
4. 点击 **Commit changes** 提交到 `main`。如果仓库要求通过分支审核，合并至 `main` 后会更新。可在 **Actions** 查看部署进度。

## 照片、项目配图和链接

在仓库的 `assets` 文件夹中点 **Add file → Upload files**。替换同名的 `portrait.jpg` 即可更新首页照片；使用其他文件名时，在 `content.js` 同步修改 `portrait`。路径区分大小写。

项目的 `images` 和 `links` 都是列表。下面展示填写格式，将示例文件名和网址换成自己的。图片按填写顺序展示，`alt` 用于读屏，`caption` 为可选图注。

```js
links: [
  { label: "项目主页", url: "https://example.org/project" }
],
images: [
  { src: "assets/courtyard.jpg", alt: "三维模型中沿街分布的院落", caption: "街区重建视图" }
]
```

在 `social` 中同样可以添加一条 `{ label: "GitHub", url: "https://github.com/你的用户名" }`。仅有链接的项目可以省略 `images`，纯文字项目也可以省略 `links`。

## GitHub Pages 首次部署

本站为静态页面，入口为根目录下的 `index.html`。在 [Pages 设置](https://github.com/1340883027/Resume/settings/pages) 的 **Build and deployment** 中，选择 **Deploy from a branch → main → / (root)** 并保存。等待首次构建成功后，点 **Visit site**。后续提交到同一分支时，GitHub 会自动发布；更新可能需要约 10 分钟。

这个仓库是项目站点，默认网址带有 `/Resume/`。页面和资源使用相对路径，四个栏目分别支持 `#home`、`#research`、`#service` 和 `#about` 深链接。[GitHub 官方部署说明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## 本地预览

用浏览器打开 `index.html` 即可预览。布局和颜色在 `style.css`，栏目渲染在 `site.js`，日常更新只需修改 `content.js` 及图片。
