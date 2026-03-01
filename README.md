# Git 日常开发高频命令速查手册

这份手册汇总了日常开发中最核心、最常用的 Git 命令，涵盖了从代码暂存、提交到远程协作、分支管理的全流程，是您提升开发效率的必备指南。

## 一、文件暂存与提交

这是日常开发中最基础的操作，用于将本地修改保存到本地仓库。

### 核心命令

```bash
# 1. 添加所有修改过的文件到暂存区
# 用途：完成一个功能模块或修复一个 bug 后，准备一次性提交所有改动。
git add .

# 2. 添加指定的单个或多个文件到暂存区
# 用途：仅提交部分修改，保持每次提交的逻辑清晰。
git add <文件名1> <文件名2>

# 3. 提交暂存区的文件到本地仓库
# 用途：记录一次完整的功能或修复。
# 技巧：提交信息遵循 "类型: 描述" 格式（如 feat, fix, docs），便于后续追踪。
git commit -m "feat: 新增用户登录功能"
```

---

## 二、代码推送与拉取

用于本地仓库与远程仓库（如 GitHub、GitLab）之间的数据同步。

### 核心命令

```bash
# 1. 首次推送本地分支到远程仓库
# 用途：将一个全新的本地分支上传到远程。
# 技巧：-u 参数会将本地分支与远程分支关联，后续推送可直接使用 git push。
git push -u origin <分支名>

# 2. 后续推送（已关联远程分支）
# 用途：将本地最新的提交更新到远程仓库。
git push

# 3. 拉取远程分支的最新更新
# 用途：同步团队成员的最新代码，避免合并时产生冲突。
# 技巧：建议在每天开始工作前或切换分支前执行此命令。
git pull origin <分支名>
```

---

## 三、分支管理

分支是 Git 最强大的功能之一，用于并行开发、功能隔离和版本控制。

### 核心命令

```bash
# 1. 查看所有分支
# 用途：了解当前仓库的分支情况，确认自己所在的分支。
git branch

# 2. 创建新分支
# 用途：为新功能或 bug 修复创建一个独立的开发环境。
git branch <新分支名>

# 3. 切换分支
# 用途：在不同的开发任务之间切换。
git checkout <分支名>

# 4. 创建并切换到新分支（最常用）
# 用途：一步到位，开始新功能的开发。
git checkout -b <新分支名>

# 5. 合并分支
# 用途：将一个分支的开发成果（如 feature 分支）合并到另一个分支（如 main 分支）。
# 技巧：合并前，确保目标分支（如 main）已拉取最新代码。
git merge <要合并的分支名>
```

---

## 四、冲突处理

当多人修改同一文件的同一部分时，合并分支会产生冲突，需要手动解决。

### 解决方案

1. **识别冲突**：`git merge` 命令执行后，Git 会提示哪些文件存在冲突。
2. **手动解决**：
   
   * 打开冲突文件，你会看到类似以下的标记：
     ```
     <<<<<<< HEAD
     // 你当前分支的代码
     =======
     // 被合并分支的代码
     >>>>>>> feature-branch
     ```
   * 手动编辑文件，保留需要的代码，并删除所有 `<<<<<<<`, `=======`, `>>>>>>>` 标记。
3. **标记为已解决**：
   
   * 解决完所有冲突后，将文件重新添加到暂存区。
   
   ```bash
   git add <冲突文件名>
   ```
4. **完成合并**：
   
   * 执行提交命令，完成整个合并过程。Git 会自动生成一条合并信息。
   
   ```bash
   git commit
   ```

---


# 🍥Fuwari  
![Node.js >= 20](https://img.shields.io/badge/node.js-%3E%3D20-brightgreen) 
![pnpm >= 9](https://img.shields.io/badge/pnpm-%3E%3D9-blue) 
[![DeepWiki](https://img.shields.io/badge/DeepWiki-saicaca%2Ffuwari-blue.svg?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAyCAYAAAAnWDnqAAAAAXNSR0IArs4c6QAAA05JREFUaEPtmUtyEzEQhtWTQyQLHNak2AB7ZnyXZMEjXMGeK/AIi+QuHrMnbChYY7MIh8g01fJoopFb0uhhEqqcbWTp06/uv1saEDv4O3n3dV60RfP947Mm9/SQc0ICFQgzfc4CYZoTPAswgSJCCUJUnAAoRHOAUOcATwbmVLWdGoH//PB8mnKqScAhsD0kYP3j/Yt5LPQe2KvcXmGvRHcDnpxfL2zOYJ1mFwrryWTz0advv1Ut4CJgf5uhDuDj5eUcAUoahrdY/56ebRWeraTjMt/00Sh3UDtjgHtQNHwcRGOC98BJEAEymycmYcWwOprTgcB6VZ5JK5TAJ+fXGLBm3FDAmn6oPPjR4rKCAoJCal2eAiQp2x0vxTPB3ALO2CRkwmDy5WohzBDwSEFKRwPbknEggCPB/imwrycgxX2NzoMCHhPkDwqYMr9tRcP5qNrMZHkVnOjRMWwLCcr8ohBVb1OMjxLwGCvjTikrsBOiA6fNyCrm8V1rP93iVPpwaE+gO0SsWmPiXB+jikdf6SizrT5qKasx5j8ABbHpFTx+vFXp9EnYQmLx02h1QTTrl6eDqxLnGjporxl3NL3agEvXdT0WmEost648sQOYAeJS9Q7bfUVoMGnjo4AZdUMQku50McDcMWcBPvr0SzbTAFDfvJqwLzgxwATnCgnp4wDl6Aa+Ax283gghmj+vj7feE2KBBRMW3FzOpLOADl0Isb5587h/U4gGvkt5v60Z1VLG8BhYjbzRwyQZemwAd6cCR5/XFWLYZRIMpX39AR0tjaGGiGzLVyhse5C9RKC6ai42ppWPKiBagOvaYk8lO7DajerabOZP46Lby5wKjw1HCRx7p9sVMOWGzb/vA1hwiWc6jm3MvQDTogQkiqIhJV0nBQBTU+3okKCFDy9WwferkHjtxib7t3xIUQtHxnIwtx4mpg26/HfwVNVDb4oI9RHmx5WGelRVlrtiw43zboCLaxv46AZeB3IlTkwouebTr1y2NjSpHz68WNFjHvupy3q8TFn3Hos2IAk4Ju5dCo8B3wP7VPr/FGaKiG+T+v+TQqIrOqMTL1VdWV1DdmcbO8KXBz6esmYWYKPwDL5b5FA1a0hwapHiom0r/cKaoqr+27/XcrS5UwSMbQAAAABJRU5ErkJggg==)](https://deepwiki.com/saicaca/fuwari)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fsaicaca%2Ffuwari.svg?type=shield&issueType=license)](https://app.fossa.com/projects/git%2Bgithub.com%2Fsaicaca%2Ffuwari?ref=badge_shield&issueType=license)

A static blog template built with [Astro](https://astro.build).

[**🖥️ Live Demo (Vercel)**](https://fuwari.vercel.app)

![Preview Image](https://raw.githubusercontent.com/saicaca/resource/main/fuwari/home.png)

🌏 README in
[**中文**](https://github.com/saicaca/fuwari/blob/main/docs/README.zh-CN.md) /
[**日本語**](https://github.com/saicaca/fuwari/blob/main/docs/README.ja.md) /
[**한국어**](https://github.com/saicaca/fuwari/blob/main/docs/README.ko.md) /
[**Español**](https://github.com/saicaca/fuwari/blob/main/docs/README.es.md) /
[**ไทย**](https://github.com/saicaca/fuwari/blob/main/docs/README.th.md) /
[**Tiếng Việt**](https://github.com/saicaca/fuwari/blob/main/docs/README.vi.md) /
[**Bahasa Indonesia**](https://github.com/saicaca/fuwari/blob/main/docs/README.id.md) (Provided by the community and may not always be up-to-date)

## ✨ Features

- [x] Built with [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com)
- [x] Smooth animations and page transitions
- [x] Light / dark mode
- [x] Customizable theme colors & banner
- [x] Responsive design
- [x] Search functionality with [Pagefind](https://pagefind.app/)
- [x] [Markdown extended features](https://github.com/saicaca/fuwari?tab=readme-ov-file#-markdown-extended-syntax)
- [x] Table of contents
- [x] RSS feed

## 🚀 Getting Started

1. Create your blog repository:
    - [Generate a new repository](https://github.com/saicaca/fuwari/generate) from this template or fork this repository.
    - Or run one of the following commands:
       ```sh
       npm create fuwari@latest
       yarn create fuwari
       pnpm create fuwari@latest
       bun create fuwari@latest
       deno run -A npm:create-fuwari@latest
       ```
2. To edit your blog locally, clone your repository, run `pnpm install` to install dependencies.
    - Install [pnpm](https://pnpm.io) `npm install -g pnpm` if you haven't.
3. Edit the config file `src/config.ts` to customize your blog.
4. Run `pnpm new-post <filename>` to create a new post and edit it in `src/content/posts/`.
5. Deploy your blog to Vercel, Netlify, GitHub Pages, etc. following [the guides](https://docs.astro.build/en/guides/deploy/). You need to edit the site configuration in `astro.config.mjs` before deployment.

## 📝 Frontmatter of Posts

```yaml
---
title: My First Blog Post
published: 2023-09-09
description: This is the first post of my new Astro blog.
image: ./cover.jpg
tags: [Foo, Bar]
category: Front-end
draft: false
lang: jp      # Set only if the post's language differs from the site's language in `config.ts`
---
```

## 🧩 Markdown Extended Syntax

In addition to Astro's default support for [GitHub Flavored Markdown](https://github.github.com/gfm/), several extra Markdown features are included:

- Admonitions ([Preview and Usage](https://fuwari.vercel.app/posts/markdown-extended/#admonitions))
- GitHub repository cards ([Preview and Usage](https://fuwari.vercel.app/posts/markdown-extended/#github-repository-cards))
- Enhanced code blocks with Expressive Code ([Preview](https://fuwari.vercel.app/posts/expressive-code/) / [Docs](https://expressive-code.com/))

## ⚡ Commands

All commands are run from the root of the project, from a terminal:

| Command                    | Action                                              |
|:---------------------------|:----------------------------------------------------|
| `pnpm install`             | Installs dependencies                               |
| `pnpm dev`                 | Starts local dev server at `localhost:4321`         |
| `pnpm build`               | Build your production site to `./dist/`             |
| `pnpm preview`             | Preview your build locally, before deploying        |
| `pnpm check`               | Run checks for errors in your code                  |
| `pnpm format`              | Format your code using Biome                        |
| `pnpm new-post <filename>` | Create a new post                                   |
| `pnpm astro ...`           | Run CLI commands like `astro add`, `astro check`    |
| `pnpm astro --help`        | Get help using the Astro CLI                        |

## ✏️ Contributing

Check out the [Contributing Guide](https://github.com/saicaca/fuwari/blob/main/CONTRIBUTING.md) for details on how to contribute to this project.

## 📄 License

This project is licensed under the MIT License.

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fsaicaca%2Ffuwari.svg?type=large&issueType=license)](https://app.fossa.com/projects/git%2Bgithub.com%2Fsaicaca%2Ffuwari?ref=badge_large&issueType=license)
"# liyueblog-test" 
"# liyueblog-test" 
"# liyueblog-test" 
"# liyueblog-test" 
