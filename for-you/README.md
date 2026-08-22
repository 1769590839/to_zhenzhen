# To 真真

狗晨留给真真的一封粉色小站。打开先看到信封，点开樱花蜡封后进入封面：信、日期倒数、碎片墙，还有开花和可以点的小彩蛋。

以后你把想说的话发给我，我可以帮你改到信和卡片里。现在先改 `js/config.js` 也可以。

## 本地打开

不需要安装任何东西。用浏览器打开 `index.html` 即可。

如果字体加载不稳，也可以在这个文件夹里开一个本地服务：

```bash
npx --yes serve .
```

## 你主要改这一个文件

打开 `js/config.js`：

- `herName` / `myName` / `nickname`：现在是真真 / 狗晨
- `meetDate` / `farewellDate` / `specialDate`：认识（8.9）、分别、要倒数的日子
- `letter`：你想留给她的正文
- `makeupTitle`：妆容夸赞，放在信下面的标题里
- `memories`：碎片墙标题；有照片就填 `photo: "assets/photos/xxx.jpg"`
- `dialogue` / `cards` / `flowerNotes`：封面对话、抽卡、花苞里的句子
- `secretWord`：想先设一个暗号再进封面，就填在这里；留空则直接进入
- `hiddenMessage`：连点五次星星才出现的那句

右下角的兔子叫团子，点它会说话。右上角可以开音乐盒，也可以切到夜晚。封面四角的花、星、月亮，还有标题旁的小心心、信纸上的星，点开都有彩蛋。

## 传到 GitHub / 做成在线网页

1. 在 GitHub 新建一个仓库（Public 或 Private 都可以）
2. 把 `for-you` 这个文件夹里的内容传上去（`index.html` 要在仓库根目录）
3. 打开仓库 **Settings → Pages**
4. Source 选 **Deploy from a branch**，分支选 `main`，目录选 `/ (root)`
5. 等一两分钟，地址一般是：

`https://你的用户名.github.io/仓库名/`

把这个链接发给她就可以了。手机打开也行。

## 素材说明

- 字体：Google Fonts 的 [ZCOOL XiaoWei](https://fonts.google.com/specimen/ZCOOL+XiaoWei)、[Ma Shan Zheng](https://fonts.google.com/specimen/Ma+Shan+Zheng)、[Noto Serif SC](https://fonts.google.com/specimen/Noto+Serif+SC)、[Noto Sans SC](https://fonts.google.com/specimen/Noto+Sans+SC)
- 插画、兔子、猫、花瓣、信封、邮票、贴纸：都是这个项目里自己画的 SVG / CSS，没有商用图库版权问题
- 照片请只使用你们自己的，放到 `assets/photos/`

## 之后还可以加

你把真实的句子、日期、暗号、照片准备好之后，跟我说一声，我可以帮你替换进去，或再加一页新的小互动。
