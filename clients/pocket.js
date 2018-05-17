const request = require('request');
const Diffbot = require('diffbot').Diffbot;

const diffbot = new Diffbot('b28b03abe2552b644475048c9cccdf12'); // your API key here

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
const callbackURL = process.env.POCKET_CALLBACK_URL;
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
        'consumer_key': process.env.POCKET_CONSUMER_KEY,
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

const _filter = (parentObj, time) => {
  const keys = Object.keys(parentObj);
  const result = [];

  for (var i = 0; i < keys.length; i++) {
    let val = parentObj[keys[i]];
    if (time - 5 < Number(val.word_count) / 230 && val.word_count / 230 <= time) {
      result.push(val);
    };
  }

  return result;
};

const getAllStories = (accessToken, time) => {
  return new Promise(function (resolve, reject) {
    const options = {
      'headers': {
        'content-type': 'application/x-www-form-urlencoded'
      },
      'url': 'https://getpocket.com/v3/get',
      'form': {
        'consumer_key': POCKET_CONSUMER_KEY,
        'access_token': accessToken
      }
    };
    request.post(options, (err, response, body) => {
      if (err) {
        reject(err);
      } else {
        // const data = formDataToJson(body);
        const data = JSON.parse(body);

        const listOfArticles = _filter(data.list, time);
        const promiseArray = [];

        for (let index = 0; index < listOfArticles.length; index++) {
          promiseArray.push(new Promise((resolve, reject) => {
            diffbot.article({
              uri: listOfArticles[index].resolved_url
            },
            function (err, response) {
              if (err) {
                reject(err);
              } ;
              const story = {
                title: response.objects[0].title,
                text: response.objects[0].text
              };
              if (response) {
                resolve(story);
              }
              // console.log(data);
            });
          })
          );
        }

        Promise.all(promiseArray).then(function (values) {
          resolve(values);
        });
      }
    });
  });
};

module.exports = {
  getRequestUrl,
  anotherOne,
  getAllStories
};
