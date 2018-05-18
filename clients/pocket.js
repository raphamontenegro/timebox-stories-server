const request = require('request');
const Diffbot = require('diffbot').Diffbot;

const diffbot = new Diffbot(process.env.DIFFBOT_CONSUMER_KEY); // your API key here

const formDataToJson = function (formData) {
  const json = {};

  formData.split('&').forEach(function (item) {
    const itemKey = item.split('=')[0];
    const itemValue = item.split('=')[1];

    json[itemKey] = itemValue;
  });

  return json;
};

const callbackURL = process.env.POCKET_CALLBACK_URL;

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
        'consumer_key': process.env.POCKET_CONSUMER_KEY,
        'access_token': accessToken
      }
    };
    request.post(options, (err, response, body) => {
      if (err) {
        reject(err);
      } else {
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
                // @note Add url to view original on the app
              };
              if (response) {
                resolve(story);
              }
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

  // const anotherOne = (user) => {
//   return new Promise(function (resolve, reject) {
//     const options = {};
//     request.post(options, (err, response, body) => {
//       if (err) {
//         reject(err);
//       } else {
//         // resolve(body);
//         // OR resolve(JSON.parse(body); ?
//       }
//     });
//   });
// };
};

module.exports = {
  getRequestUrl,
  getAllStories
};
