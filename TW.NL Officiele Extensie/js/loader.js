const d = document;
['js/twLib.js', 'js/TWextension.js'].forEach((item) => {
  let s = d.createElement('script');
  s.src = chrome.runtime.getURL(item);
  (d.head || d.documentElement || d.body).appendChild(s);
  s.parentNode.removeChild(s);
});
