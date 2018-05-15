const request = require('request');

const formDataToJson = function (formData) {
  const json = {};

  formData.split('&').forEach(function (item) {
    const itemKey = item.split('=')[0];
    const itemValue = item.split('=')[1];

    json[itemKey] = itemValue;
  });

  return json;
};

// @todo const callbackURL = `${process.env.API_URL}auth/pocket/callback`;
const callbackURL = 'http://localhost:3000/auth/pocket/callback';
// @todo POCKET_CONSUMER_KEY = process.env.POCKET_CONSUMER_KEY,
const POCKET_CONSUMER_KEY = '77233-bc1d5f96390df6ad14c48477';

const getRequestUrl = () => {
  return new Promise(function (resolve, reject) {
    const options = {
      'headers': {
        'content-type': 'application/x-www-form-urlencoded'
      },
      'url': 'https://getpocket.com/v3/oauth/request',
      'form': {
        'consumer_key': POCKET_CONSUMER_KEY,
        'redirect_uri': callbackURL
      }
    };
    request.post(options, (err, response, body) => {
      if (err) {
        reject(err);
      } else {
        const data = formDataToJson(body);
        const url = `https://getpocket.com/auth/authorize?request_token=${data.code}&redirect_uri=${callbackURL}`;
        resolve(url);
      }
    });
  });
};

const anotherOne = (user) => {
  return new Promise(function (resolve, reject) {
    const options = {};
    request.post(options, (err, response, body) => {
      if (err) {
        reject(err);
      } else {
        // resolve(body);
        // OR resolve(JSON.parse(body); ?
      }
    });
  });
};

module.exports = {
  getRequestUrl,
  anotherOne
};
