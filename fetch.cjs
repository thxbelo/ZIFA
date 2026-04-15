fetch('https://zifasouthernregion.netlify.app/')
  .then(r => r.text())
  .then(t => console.log(t.substring(0, 1000)))
  .catch(console.error);
