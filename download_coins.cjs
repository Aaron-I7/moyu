
const fs = require('fs');
const https = require('https');
const path = require('path');

const downloads = [
  {
    url: "https://image.pollinations.ai/prompt/Ancient%20Chinese%20copper%20coin%2C%20front%20view%2C%20golden%20bronze%20texture%2C%20with%20Chinese%20characters%20'%E4%B9%BE%E9%9A%86%E9%80%9A%E5%AE%9D'%2C%20realistic%20style%2C%20transparent%20background?width=1024&height=1024",
    dest: "public/images/divination/coin_front.png"
  },
  {
    url: "https://image.pollinations.ai/prompt/Ancient%20Chinese%20copper%20coin%2C%20back%20view%2C%20golden%20bronze%20texture%2C%20with%20Manchu%20script%2C%20realistic%20style%2C%20transparent%20background?width=1024&height=1024",
    dest: "public/images/divination/coin_back.png"
  }
];

downloads.forEach(item => {
  const file = fs.createWriteStream(path.resolve(item.dest));
  https.get(item.url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Download completed: ' + item.dest);
    });
  }).on('error', (err) => {
    fs.unlink(item.dest);
    console.error('Error downloading ' + item.dest + ': ' + err.message);
  });
});
