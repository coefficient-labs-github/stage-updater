chrome.action.onClicked.addListener((tab) => {
  chrome.windows.create({
    url: 'window.html',
    type: 'popup',
    width: 400,
    height: 600
  });
}); 