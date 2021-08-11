const Pusher = require("pusher");
const config = require("../config");

// Pusher
const pusher = new Pusher({
  appId: config.pusher.appID,
  key: config.pusher.key,
  secret: config.pusher.secret,
  cluster: config.pusher.cluster,
});

module.exports = pusher;
