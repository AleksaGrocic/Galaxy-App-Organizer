const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function ensureDataDirectoryAndFile() {
  const dataDirectory = path.join(app.getAppPath(), 'data');
  const imgDirectory = path.join(app.getAppPath(), 'img');

  const jsonFilePath = path.join(dataDirectory, 'data.json');

  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory);
  }

  if (!fs.existsSync(imgDirectory)) {
    fs.mkdirSync(imgDirectory);
  }

  if (!fs.existsSync(jsonFilePath)) {
    fs.writeFileSync(jsonFilePath, '[]');
  }
}

ensureDataDirectoryAndFile();

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 750,
    height: 850,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');

  ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
  });

  ipcMain.on('close-window', () => {
    mainWindow.close();
  });

  ipcMain.on('get-existing-apps', (event) => {
    const jsonFilePath = path.join(app.getAppPath(), 'data', 'data.json');
  
    fs.readFile(jsonFilePath, 'utf8', (err, fileContent) => {
      if (err) {
        console.error(err);
        return;
      }
  
      const existingData = fileContent ? JSON.parse(fileContent) : [];
      event.reply('existing-apps', existingData);
    });
  });

  ipcMain.on('add-app', (event, data) => {
    ensureDataDirectoryAndFile(); // Ensure data directory and file existence
    addApp(data, event);
  });

  ipcMain.on('launch-app', (event, data) => {
    const { appExePath } = data;
    shell.openPath(appExePath).catch((error) => {
      console.error(error);
      event.reply('error', { message: 'An error occurred while launching the app.' });
    });
  });

  ipcMain.on('update-app-order', (event, updatedOrder) => {
    ensureDataDirectoryAndFile(); // Ensure data directory and file existence
    const jsonFilePath = path.join(app.getAppPath(), 'data', 'data.json');
  
    fs.readFile(jsonFilePath, 'utf8', (err, fileContent) => {
      if (err) {
        console.error(err);
        return;
      }
  
      const existingData = fileContent ? JSON.parse(fileContent) : [];
  
      const updatedData = updatedOrder.map((appName) => {
        return existingData.find((app) => app.appName === appName);
      });
  
      fs.writeFile(jsonFilePath, JSON.stringify(updatedData), (err) => {
        if (err) {
          console.error(err);
          return;
        }
  
        console.log(`App order updated in: ${jsonFilePath}`);
      });
    });
  });
});

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

app.on('open-file', (event, filePath) => {
  event.preventDefault();
  mainWindow.webContents.send('open-file', filePath);
});

function addApp(data, event) {
  const { appName, appExe, appImage, previousWindow } = data;

  const currentDirectory = app.getAppPath();
  const imgFileName = `${appName}${path.extname(appImage.name)}`;
  const imgFilePath = path.join(currentDirectory, 'img', imgFileName);

  fs.readFile(appImage.path, (err, fileData) => {
    if (err) {
      console.error(err);
      return;
    }

    fs.writeFile(imgFilePath, fileData, (err) => {
      if (err) {
        console.error(err);
        return;
      }

      console.log(`Image saved to: ${imgFilePath}`);

      const appInfo = {
        appName: appName,
        appExePath: appExe.path,
        imgPath: imgFilePath,
        type: previousWindow,
      };

      const jsonFilePath = path.join(currentDirectory, 'data', 'data.json');

      fs.readFile(jsonFilePath, 'utf8', (err, fileContent) => {
        if (err) {
          console.error(err);
          return;
        }

        const existingData = fileContent ? JSON.parse(fileContent) : [];
        existingData.push(appInfo);

        fs.writeFile(jsonFilePath, JSON.stringify(existingData), (err) => {
          if (err) {
            console.error(err);
            return;
          }

          console.log(`App information appended to: ${jsonFilePath}`);
          event.reply('app-added', appInfo);
        });
      });
    });
  });
}
