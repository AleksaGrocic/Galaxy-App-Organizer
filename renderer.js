const ipcRenderer = window.electron.ipcRenderer;

var color1 = "#fc6076";
var color2 = "#ff9a44";

document.addEventListener("DOMContentLoaded", function () {
  showTab("tabPrograms");
  var previousWindow;
  renderExistingApps();

  const openJsonButton = document.getElementById("openJsonButton");
  if (openJsonButton) {
    openJsonButton.addEventListener("click", () => {
      ipcRenderer.send("open-json-file");
    });
  }  
});

function showTab(tabId) {
  const tabs = document.querySelectorAll('.tab-content');
  const divButtonSettings = document.getElementById('divButtonSettings');
  const buttonSettingsSquare = document.getElementById('buttonSettingsSquare');
  const buttonSettings = document.getElementById('buttonSettings');
  tabs.forEach(tab => {
    tab.style.display = 'none';
  });

  const selectedTab = document.getElementById(tabId);
  if (selectedTab) {
    selectedTab.style.display = 'flex';
  }

  var tabButtons = document.getElementById("tabButtons");
  var tabButtonPrograms = document.getElementById("tabButtonPrograms");
  var tabButtonGames = document.getElementById("tabButtonGames");

  localStorage.setItem("color1", color1);
  localStorage.setItem("color2", color2);

  switch (true) {
    case (tabId == "tabPrograms"):
      tabButtonPrograms.style.background = `linear-gradient(to right, ${localStorage.getItem("color1")}, ${localStorage.getItem("color2")})`;
      tabButtonGames.style.background = "rgb(50,54,64)";

      if (tabButtonGames.classList.contains("active")) {
        tabButtonGames.classList.toggle("active");
      }

      if (!tabButtonPrograms.classList.contains("active")) {
        tabButtonPrograms.classList.toggle("active");
      }

      previousWindow = "tabPrograms";
      break;

    case (tabId == "tabGames"):
      tabButtonGames.style.background = `linear-gradient(to right, ${localStorage.getItem("color2")}, ${localStorage.getItem("color1")})`;
      tabButtonPrograms.style.background = "rgb(50,54,64)";
      
      if (tabButtonPrograms.classList.contains("active")) {
        tabButtonPrograms.classList.toggle("active");
      }

      if (!tabButtonGames.classList.contains("active")) {
        tabButtonGames.classList.toggle("active");
      }

      previousWindow = "tabGames";
      break;

    case (tabId == "tabAddApp"):
      tabButtons.style.display = 'none';
      document.getElementById('tabAddApp').style.display = "flex";
      divButtonSettings.style.display = "none";

      document.getElementById("buttonAddApp").style.background = `linear-gradient(to right, ${localStorage.getItem("color1")}, ${localStorage.getItem("color2")})`;

      break;

    case (tabId == "tabSettings"):
      tabButtons.style.display = 'none';
      document.getElementById('tabSettings').style.display = "flex";
      document.getElementById("submitChangeAccent").style.background = `linear-gradient(to right, ${localStorage.getItem("color1")}, ${localStorage.getItem("color2")})`;
      buttonSettings.style.transform = 'rotate(180deg)';
      buttonSettingsSquare.onclick = function() { returnToMainTab(); };
  }
}

function addApp() {
  var appName = document.getElementById("inputName").value;
  var appExe = document.getElementById("inputExe").files[0];
  var appImage = document.getElementById("inputImage").files[0];

  if (!appName || !appExe || !appImage) {
    alert("Please fill in all fields.")
    return;
  }

  // Extract relevant information from File objects
  const appExeInfo = {
    name: appExe.name,
    path: appExe.path,
  };

  const appImageInfo = {
    name: appImage.name,
    path: appImage.path,
  };

  // Send the information through IPC
  ipcRenderer.send('add-app', { 
    appName, 
    appExe: appExeInfo, 
    appImage: appImageInfo, 
    previousWindow, 
    type: getActiveTabId() });

  // Reset the input fields and hide the "Add App" tab
  resetInputFields();
  returnToMainTab();
}

function getActiveTabId() {
  const tabButtons = document.getElementById("tabButtons");
  const activeTabButton = tabButtons.querySelector('.active');
  
  if (activeTabButton) {
    return activeTabButton.id.replace('tabButton', 'tab');
  }

  // If no active tab button is found, default to tabPrograms
  return 'tabPrograms';
}

ipcRenderer.on('app-added', (event, appInfo) => {
  renderApp(appInfo); // Render the newly added app
});

function renderExistingApps() {
  const activeTabId = getActiveTabId();
  showTab(activeTabId); // Ensure the correct tab is visible

  // Retrieve the existing apps from the main process
  ipcRenderer.send('get-existing-apps');

  ipcRenderer.on('existing-apps', (event, existingApps) => {
    existingApps.forEach(appInfo => {
      renderApp(appInfo);
    });
  });
}

function renderApp(appInfo) {
  const appDiv = document.createElement('div');
  appDiv.className = 'app-div';
  appDiv.setAttribute('data-app-name', appInfo.appName); // Add a data attribute for app name

  const appImage = document.createElement('img');
  appImage.src = appInfo.imgPath;
  appImage.alt = appInfo.appName;
  appImage.width = 100;
  appImage.height = 100;

  const appNameLabel = document.createElement('div');
  appNameLabel.className = 'app-label';
  appNameLabel.textContent = appInfo.appName;

  appDiv.appendChild(appImage);
  //appDiv.appendChild(appNameLabel);

  appDiv.addEventListener('click', () => {
    launchApp(appInfo.appExePath);
  });

  const tabContent = document.getElementById(appInfo.type);
  if (tabContent) {
    tabContent.insertBefore(appDiv, tabContent.firstChild);
  } else {
    console.error(`Tab content element with id ${appInfo.type} not found.`);
  }
}

function launchApp(appExePath) {
  // Use IPC to send a message to the main process to launch the app
  ipcRenderer.send('launch-app', { appExePath });
}

function clickColorInput(colorInputId) {
  switch (true) {
    case (colorInputId == "1"):
      document.getElementById("colorInputOne").click();
      break;
    
    case (colorInputId == "2"):
      document.getElementById("colorInputTwo").click();
      break;
  }
}

function changeAccent() {
  color1 = document.getElementById("colorInputOne").value;
  color2 = document.getElementById("colorInputTwo").value;

  localStorage.setItem("color1", color1);
  localStorage.setItem("color2", color2);

  returnToMainTab();
  showTab(previousWindow);
  document.getElementById("buttonAddApp").style.background = `linear-gradient(to-right, ${localStorage.getItem("color1")}, ${localStorage.getItem("color2")})`;
  document.getElementById("submitChangeAccent").style.background = `linear-gradient(to right, ${localStorage.getItem("color1")}, ${localStorage.getItem("color2")})`;
}

function resetInputFields() {
  document.getElementById("inputName").value = '';
  document.getElementById("inputExe").value = '';
  document.getElementById("inputImage").value = '';
}

function returnToMainTab() {
  const divButtonSettings = document.getElementById('divButtonSettings');
  const buttonSettings = document.getElementById('buttonSettings');
  document.getElementById("tabAddApp").style.display = 'none';
  document.getElementById("tabSettings").style.display = 'none';
  document.getElementById("tabButtons").style.display = 'flex';
  document.getElementById(previousWindow).style.display = 'flex';
  divButtonSettings.style.display = "flex";
  buttonSettings.style.transform = 'rotate(0deg)';
  buttonSettingsSquare.onclick = function() { showTab('tabSettings'); };
}

function minimizeWindow() {
  ipcRenderer.send('minimize-window');
}

function closeWindow() {
  ipcRenderer.send('close-window');
}
