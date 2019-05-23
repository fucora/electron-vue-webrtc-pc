import electron from 'electron'
import { app, BrowserWindow, Menu, dialog, Notification, ipcMain } from 'electron'
import pkg from '../../package.json'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow;
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

const presentationWinURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080/#presentation`
  : `file://${__dirname}/index.html#presentation` 

const screenWinURL = process.env.NODE_ENV === 'development'
? `http://localhost:9080/#screen`
: `file://${__dirname}/index.html#screen` 

function createWindow () {
  /**
   * Initial window options
   */
  // 获取屏幕尺寸
  const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize
  mainWindow = new BrowserWindow({
    height: height-50,
    useContentSize: true,
    width: width-50,
    minWidth: 1000,
    minHeight: 600,
    title: 'svoc云视频'
  })

  mainWindow.loadURL(winURL)
  // 扩展程序
  BrowserWindow.addExtension(__static +'/Extension/SVOC-Screensharing-Extension');
  // 打开开发工具页面
  // mainWindow.webContents.openDevTools({mode: "right"})

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 创建菜单
function createMenu() {
  const template = [
    {
      label: '编辑',
      submenu: [
        // { role: 'undo' },
        // { role: 'redo' },
        // { type: 'separator' },
        // { role: 'cut' },
        // { role: 'copy' },
        // { role: 'paste' },
        // { role: 'pasteandmatchstyle' },
        // { role: 'delete' },
        // { role: 'selectall' },
        {
          label: '关于我们',
          click () {
            dialog.showMessageBox({
              title: 'SVOC',
              message: 'SVOC云视频',
              detail: `云起融通一直致力于运用领先的技术手段，为全球政企客户提供顶尖的全融合统一通讯云平台以及音视频增值业务解决方案。\nVersion: ${pkg.version}\nAuthor: ${pkg.author}\nCopyright © 2019 北京云起融通科技有限公司版权所有.`
            })
          }
        },
        {
          label: '了解更多',
          click () {
            require('electron').shell.openExternal('https://vip.svocloud.com')
          }
        }
      ]
    },
    {
      label: '查看',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'toggledevtools', label: '开发者工具'},
        { role: 'togglefullscreen', label: '全屏' },
        {
            label: '退出',
            click () {
                app.quit()
            }
        },
      ]
    }
  ]

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    })

    // Edit menu
    template[1].submenu.push(
      { type: 'separator' },
      {
        label: 'Speech',
        submenu: [
          { role: 'startspeaking' },
          { role: 'stopspeaking' }
        ]
      }
    )

    // Window menu
    // template[3].submenu = [
    //   { role: 'close' },
    //   { role: 'minimize' },
    //   { role: 'zoom' },
    //   { type: 'separator' },
    //   { role: 'front' }
    // ]
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu);
}

// 退出登录
ipcMain.on('logout-dialog', function (event) {
    const options = {
        type: 'info',
        title: '退出',
        message: "您确定要退出吗？",
        buttons: ['确定', '取消']
    }
    dialog.showMessageBox(options, function (index) {
        event.sender.send('logout-dialog-selection', index)
    })
})

// 错误消息
ipcMain.on('open-error-dialog', function (event) {
    dialog.showErrorBox('错误', '这是一条错误消息');
})
// 创建一个presentation新窗口
let presentationWin;
const createPresentationWin = () =>{
  let displays = electron.screen.getAllDisplays()
  let externalDisplay = displays.find((display) => {
    return display.bounds.x !== 0 || display.bounds.y !== 0
  })
  if (presentationWin) {
    return false
  }
  let obj;
  if(externalDisplay){
    obj = {
      width: 800, 
      height: 600,
      title: '共享',
      x: externalDisplay.bounds.x + 50,
      y: externalDisplay.bounds.y + 50
      // parent: mainWindow, //mainWindow是主窗口
    }
  }else{
    obj = {
      width: 800, 
      height: 600,
      title: '共享',
      // parent: mainWindow, //mainWindow是主窗口
    }
  }
  presentationWin = new BrowserWindow(obj)
  presentationWin.loadURL(presentationWinURL)

  presentationWin.on('closed', () => {
    // 关闭窗口前通知渲染进程，改变状态
    mainWindow.webContents.send('ipcPresentationWin', false)
    presentationWin = null
  })
  return presentationWin
}
// 创建一个screen新窗口
let screenWin;
const createScreenWin = () => {
  if (screenWin) {
    return false
  }
  let obj = {
    width: 800, 
    height: 500,
    // frame:false,
    title: '共享屏幕',
    parent: mainWindow, //mainWindow是主窗口
  }

  screenWin = new BrowserWindow(obj)
  screenWin.loadURL(screenWinURL)

  screenWin.on('closed', () => {
    screenWin = null
  })
  return screenWin
}

global.presentationObj = 'none';
global.presentationWinStaus = false;
ipcMain.on('accept-share', function (event, arg) {
  global.presentationObj = arg;
  /*** 测试代码 */
  // const notification = new Notification({
  //   title: `收到${arg.name}的共享源`,
  //   body: arg.src
  // })
  // notification.show()
  /*** /测试代码 */

  if(presentationWin){
    presentationWin.webContents.send('presentationObj', arg)
    event.sender.send('presentationObj', arg)
  }
  
})
// 打开一个presentation新窗口
ipcMain.on('presentation-window', function (event, arg) {
  if(arg === 'open') {
    if (!presentationWin) {
      createPresentationWin()
    }else{
      presentationWin.show()
    }
    /*** 测试代码 */
    // const notification = new Notification({
    //   title: arg,
    //   body: '打开共享独立窗口'
    // })
    // notification.show()
    /*** /测试代码 */

    event.sender.send('ipcPresentationWin', true)
    
  }else if(arg === 'close') {
    presentationWin.close()
    /*** 测试代码 */
    // const notification = new Notification({
    //   title: arg,
    //   body: '关闭共享独立窗口'
    // })
    // notification.show()
    /*** /测试代码 */
    
  }
  
})
// 关闭presentation窗口
ipcMain.on('close-presentationwin', function (event) {
  
})

// 打开一个screen新窗口
ipcMain.on('screen-window', function (event) {
  if (!screenWin) {
    createScreenWin()
  }else{
    screenWin.show();
  }
  // presentationWin.hide();
})

app.on('ready', ()=>{
    createWindow();
    createMenu();
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
