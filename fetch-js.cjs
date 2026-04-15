fetch('https://zifasouthernregion.netlify.app/assets/index-DMSdj_6y.js')
  .then(async r => {
    console.log('Status:', r.status);
    console.log('Content-Type:', r.headers.get('content-type'));
    const t = await r.text();
    console.log('Content starts with:', t.substring(0, 200).replace(/\n/g, '\\n'));
  })
  .catch(console.error);
