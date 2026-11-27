# 娄静远的个人网站

[查看网站](https://loujingyuan.github.io/me/) · [在线编辑内容](https://github.com/Loujingyuan/me/edit/main/content.js) · [查看发布进度](https://github.com/Loujingyuan/me/actions)

## 可视化编辑（推荐）

双击本地的 `editor.html`，或在预览网址末尾打开 `/editor.html`。上线后可以从[线上编辑器](https://loujingyuan.github.io/me/editor.html)进入。

1. 在「编辑栏目」选择要修改的部分。点「新增栏目」创建页面，或选择科研项目、社会服务等现有栏目进行改名、排序或删除。首页的个人介绍、教育和工作经历，以及「关于我」可编辑内容。
2. 用「新增条目」添加正文、图片和链接。正文和说明保留输入时的换行。在「添加左侧图片」选择原图，展开「调整裁切」并对照实时预览调整位置和缩放。默认居中，原图随内容文件导出。
3. 点「保存内容文件」，将文件保存为网站目录中的 `content.js`。如果浏览器只提供下载，用下载文件替换原文件。
4. 点「更新到 GitHub」，下载 `content.js` 并提交到仓库。若原图较多，导致 GitHub 网页无法接收内容文件，可把原图单独上传到 `assets`，再在编辑器的「仓库图片路径」中填写相对路径，例如 `assets/photo.jpg`。

## 直接修改内容文件

1. 打开上面的“在线编辑内容”，使用有仓库写入权限的 GitHub 账号登录。
2. 在 `content.js` 中找到相应栏目。个人介绍在 `intro`，教育在 `education`，工作在 `work`，可增删的栏目在 `sections`（旧版的科研和社会服务也可从 `projects`、`service` 直接读取），爱好在 `interests`，社交链接在 `social`。
3. 修改双引号内的文字。新增经历时复制一条完整记录，按希望展示的次序排列，用英文逗号分隔记录。
4. 点击 **Commit changes** 提交到 `main`。如果仓库要求通过分支审核，合并至 `main` 后会更新。可在 **Actions** 查看部署进度。

## 照片、项目配图和链接

在仓库的 `assets` 文件夹中点 **Add file → Upload files**。替换同名的 `portrait.jpg` 即可更新首页照片；使用其他文件名时，在 `content.js` 同步修改 `portrait`。路径区分大小写。

教育、工作、社会服务、兴趣爱好和社交链接可以用 `image: "assets/文件名.jpg"` 指定条目图片。科研项目的 `images` 和 `links` 都是列表。同一栏目中，左侧图片使用统一宽度，图片区域随右侧内容拉伸。多张图片纵向排列。`alt` 用于读屏，`caption` 为可选图注，`crop` 保存横向位置、纵向位置和缩放比例。

```js
links: [
  { label: "项目主页", url: "https://example.org/project" }
],
images: [
  { src: "assets/courtyard.jpg", alt: "三维模型中沿街分布的院落", caption: "街区重建视图", crop: { x: 50, y: 35, zoom: 1.2 } }
]
```

在 `social` 中同样可以添加一条 `{ label: "GitHub", url: "https://github.com/你的用户名" }`。仅有链接的项目可以省略 `images`，纯文字项目也可以省略 `links`。

## GitHub Pages 首次部署

本站为静态页面，入口为根目录下的 `index.html`。在 [Pages 设置](https://github.com/Loujingyuan/me/settings/pages) 的 **Build and deployment** 中，选择 **Deploy from a branch → main → / (root)** 并保存。等待首次构建成功后，点 **Visit site**。后续提交到同一分支时，GitHub 会自动发布；更新可能需要约 10 分钟。

这个仓库是项目站点，默认网址带有 `/me/`。页面和资源使用相对路径，四个栏目分别支持 `#home`、`#research`、`#service` 和 `#about` 深链接。[GitHub 官方部署说明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## 本地预览

用浏览器打开 `index.html` 即可预览。布局和颜色在 `style.css`，栏目渲染在 `site.js`，日常更新只需修改 `content.js` 及图片。
