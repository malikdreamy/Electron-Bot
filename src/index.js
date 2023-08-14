const { app, BrowserWindow, ipcMain, session } = require('electron');
const { dialog } = require('electron');
const { ipcRenderer } = require('electron');
const path = require('path');

//set user agent for app
app.userAgentFallback = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

//main process function
const createWindow = () => {
  // Create main window
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      worldSafeExecuteJavaScript: true,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
    },
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  // // Open the DevTools.
  //mainWindow.webContents.openDevTools();  
  ipcMain.on('insertText', (event, text) => {
    instaWindow.webContents.insertText(text);
   });
   
  //listen and wait for ipcMain launchBrowser function to be ran so instagram window spawns, this process comes from render.js
  //params include the params from render.js
  ipcMain.on('launchBrowser', async (event, params) => {
    console.log('launchBrowser Ran!')
    try{
      //create instagram window
      instaWindow = new BrowserWindow({
        width: 1000,
        height: 1000,
        titleBarStyle: 'hidden',
        webPreferences: {
          preload: path.join(__dirname, './instaPreload.js'), //include instaPreload.js
          contextIsolation: true,
          enableRemoteModule: true,
          worldSafeExecuteJavaScript: true,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36',
        },
      });      
      /*
      add the insertText function from node to the insta window since 
      node integration is turned off for insta window,
      on stopBot stop instaWindow
      */
      
      let username = params.username;
      const instaSession = instaWindow.webContents.session;
      
      /*
      on every webrequest be sure to send modified headers with updated user agent and sec-ch-ua,
      also on every launch of the insta page clear the browser localStorage and cookies and caches
      */
     instaSession.webRequest.onBeforeSendHeaders((details, callback) => {
       details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36';
       callback({ cancel: false, requestHeaders: details.requestHeaders });
      });
      instaSession.webRequest.onBeforeSendHeaders((details, callback) => {
        const modifiedHeaders = Object.assign({}, details.requestHeaders);
        modifiedHeaders['sec-ch-ua'] = '"Google Chrome";v="113", "Chromium";v="113", "Not-A.Brand";v="24"';
        callback({ cancel: false, requestHeaders: modifiedHeaders });
      });
      instaWindow.webContents.clearHistory();
      instaWindow.webContents.executeJavaScript(`localStorage.clear();`)
      
      instaWindow.webContents.openDevTools();
      function clearCookies() {
        const session = instaWindow.webContents.session
        const options = {
          storages: ['cookies', 'caches'], // Clear cookies and caches
          quotas: ['temporary', 'persistent', 'syncable'] // Clear all types of cookies
        };
        session.clearStorageData(options, (error) => {
          if (error) {
            console.error('Error clearing cookies:', error);
          } else {
            console.log('Cookies cleared successfully');
          }
        });
      }
      // Call the function to clear cookies
      clearCookies();
      // instaWindow.webContents.on('did-finish-load', () => {
        //   console.log(instaWindow.webContents.getUserAgent()); 
        // });
        
        // navigate to instagram
        const url = 'https://www.instagram.com/accounts/login/'
        instaWindow.loadURL(url);
        //login process
        let signedIn = false;
        instaWindow.webContents.on('did-navigate', async () => {
          if (!signedIn && instaWindow.webContents.getURL() !== 'https://www.instagram.com/accounts/login/two_factor?next=%2F') {
            signedIn = true;
            await new Promise(r => setTimeout(r, 5000));
            instaWindow.webContents.executeJavaScript(`
            try{
              const runBot = async () => {
                console.log("intro before login");
                let username = '${params.username}'
                let pass = '${params.pass}'
                console.log(username)
                const inputBox = document.querySelector('[name="username"]');
                inputBox.focus();
                await new Promise(r => setTimeout(r, 3000));
                // renderer.js
                electronAPI.insertText(username);
                
                await new Promise(r => setTimeout(r, 3000));
                const inputBox2 = document.querySelector('[name="password"]');
                inputBox2.focus();
                await new Promise(r => setTimeout(r, 1000));
                electronAPI.insertText(pass);
                await new Promise(r => setTimeout(r, 1000));
                const signIn = document.querySelector('._acan._acap._acas._aj1-');
                signIn.click();
              }
              runBot();
            }catch(err){
              console.log(err)
            }`); 
            
            //after successful login if directed to save-sign in page, then redirect directly to variant following page
          }  
        })
        
        instaWindow.webContents.on('did-navigate-in-page', async () => {
          if(instaWindow.webContents.getURL() == 'https://www.instagram.com/accounts/onetap/?next=%2F' || instaWindow.webContents.getURL() == 'https://www.instagram.com' || instaWindow.webContents.getURL() == 'https://www.instagram.com/') {
            console.log("redirect!!")
            await new Promise(r => setTimeout(r, 5000));
            instaWindow.webContents.executeJavaScript(`
            try{
              console.log("REDIRECT!!!")
              const reDirect = async() =>{
                window.location.href = 'https://www.instagram.com/?variant=following'
              }
              reDirect();
            }catch(err){
              console.log(err)
            }
            `)
            /* 
            if on variant login page then proceed to click comment button, check if user has commented on the post
            by using regex. if user has commented already then reload the page, if not then comment.
            */
          }else if(instaWindow.webContents.getURL() == 'https://www.instagram.com/?variant=following') {
            await new Promise(r => setTimeout(r, 7000));
            instaWindow.webContents.executeJavaScript(`
            try{
              console.log("clicking button")
              const clickComment = async() =>{
                await new Promise(r => setTimeout(r, 10000));
                if(window.location.href == 'https://www.instagram.com/?variant=following'){
                  document.querySelector('[aria-label="Comment"]').parentElement.click();
                  
                }
                
              }
              clickComment();
            }catch(err){
              console.log(err)
            } `)
          } else if(instaWindow.webContents.getURL() !== 'https://www.instagram.com/' &&  instaWindow.webContents.getURL() !== 'https://www.instagram.com/?variant=following' && instaWindow.webContents.getURL() !== 'https://www.instagram.com/accounts/onetap/?next=%2F' && instaWindow.webContents.getURL() !== 'https://www.instagram.com/accounts/login/two_factor?next=%2F' && instaWindow.webContents.getURL() !== 'https://www.instagram.com/accounts/login/'){
            
            instaWindow.webContents.executeJavaScript(`
            console.log(window.location.href)
            console.log("at comment section")
            const checkComment = async () => {
              await new Promise(r => setTimeout(r, 8000));
              const searchString = '${username}';
              const regex = new RegExp(searchString);
              const commentsToSearch = document.querySelector('._ae2s._ae3v._ae3w').innerText;
              const shouldComment = regex.test(commentsToSearch) ? 'dontComment' : 'doComment';
              electronAPI.sendMessageToMain(shouldComment);
            }
            checkComment();
            
            `)
            let numToMain = 1;
            console.log(`sent message to main process ${numToMain++} times`)
            ipcMain.removeAllListeners('messageFromRenderer');
            // after checking on client side and user has not commented on post already then proceed to comment
            
            ipcMain.on('messageFromRenderer', async (event, message) => {
              console.log('Received message from renderer:', message);
              
              let shouldComment = message

              
              
              if(shouldComment == 'doComment'){
                // hit tab button three times to focus on the contents of post before pressing c to
                //bring focus to commentBox
                instaWindow.webContents.sendInputEvent({
                  type: 'keyDown',
                  keyCode: 'Tab',
                });
                instaWindow.webContents.sendInputEvent({
                  type: 'keyUp',
                  keyCode: 'Tab',
                });
                instaWindow.webContents.sendInputEvent({
                  type: 'keyDown',
                  keyCode: 'Tab',
                });
                instaWindow.webContents.sendInputEvent({
                  type: 'keyUp',
                  keyCode: 'Tab',
                });
                await new Promise(r => setTimeout(r, 500));
                instaWindow.webContents.sendInputEvent({
                  type: 'keyDown',
                  keyCode: 'Tab',
                });
                instaWindow.webContents.sendInputEvent({
                  type: 'keyUp',
                  keyCode: 'Tab',
                });
                await new Promise(r => setTimeout(r, 500));
                instaWindow.webContents.sendInputEvent({
                  type: 'keyDown',
                  keyCode: 'c',
                });
                instaWindow.webContents.sendInputEvent({
                  type: 'keyUp',
                  keyCode: 'c',
                });
                await new Promise(r => setTimeout(r, 4000));
                // get random comment function
                let commentArr = params.comment;
                const randomComment = () => {
                  for (var i = 0; i < commentArr.length ; i++) { // pick random comment from comment Array
                    let randomValue = commentArr[Math.floor(Math.random() * commentArr.length)];
                    return randomValue;
                  }
                }
                let commentToLeave = `${randomComment()}`
      
                console.log('leaving comment!')
                instaWindow.webContents.executeJavaScript(`
                try{
                  const postComment = async () =>{
                    await new Promise(r => setTimeout(r, 5000));
                    electronAPI.insertText('${commentToLeave}');
                    await new Promise(r => setTimeout(r, 3000));
                    const el = document.getElementsByTagName('div');
                    for(i = 0; i < el.length; i++){
                      if (el[i].innerText == 'Post'){
                      el[i].click(); 
                    }};
                  }
                
                postComment();      
                } catch(err){
                  window.location.href = "https://www.instagram.com/?variant=following";
                }
                
                `)
                await new Promise(r => setTimeout(r, 3000));                
             
            
                commentIteration = Number(params.iterator);
                const calculateCommentInterval = (commentIteration) => {    
                  return 60 * 60 * 1000 / commentIteration;
                }
                await new Promise(r => setTimeout(r, calculateCommentInterval(commentIteration)));
                //after commenting refresh the page and restart the process
                //leave a timeout function here to meet user request
                instaWindow.webContents.executeJavaScript(`window.location = 'https://www.instagram.com/?variant=following'`);
              } else {
        
                instaWindow.webContents.executeJavaScript(`window.location = 'https://www.instagram.com/?variant=following'`)
              }
            })
          } else if (instaWindow.webContents.getURL() == 'https://www.instagram.com/accounts/login/two_factor?next=%2F'){
            dialog.showMessageBox({
              type: 'info',
              message: 'Enter Authentication Code Sent To Your Email Or Phone!',
              buttons: ['OK']
            });

          }
        }); //ending did-navigate-in-page
      }catch(err){
        console.log(err)
        dialog.showMessageBox({
          type: 'info',
          message: 'Error In Commenting Process! Close Window And Press Red "STOP BOT" Button Before Retrying!',
          buttons: ['OK']
        });      }
    })
  } //end createWindow curly bracket
  ipcMain.on('stopBot', (event) => {
   try {
     if (instaWindow) {
       console.log(`ipcMain Listener Count: ${ipcMain.listenerCount('launchBrowser')}`)
       instaWindow.destroy();
       instaWindow = null;
     }
   } catch (err) {
     console.log(err);
   }
 });


  app.on('ready', createWindow);
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
