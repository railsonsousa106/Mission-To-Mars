const PUSHER_KEY = "743680790a1a9fb25ecd";
const PUSHER_CLUSTER = "us3";

Pusher.logToConsole = true;

let _collaboration;
// const BACKEND_ENDPOINT = "http://127.0.0.1:3000";
const BACKEND_ENDPOINT = "https://miro-poster.herokuapp.com";

class Collaboration {
  constructor(stage, channelName) {
    this.stage = stage;
    this.channelName = channelName;
    this.socket = io.connect(BACKEND_ENDPOINT);
    _collaboration = this;
  }

  initListners() {
    const _that = this;
    initNodes(_that.stage, _that.channelName);

    this.socket.on("client-update-node", function (data) {
      console.log("*** update node *** ", data);
      if (data.channel === _that.channelName) {
        updateNode(_that.stage, data.actions);
      }
    });

    this.stage.on("updateNode", this.onUpdateNode);
  }
  onUpdateNode(e) {
    if (!_collaboration.stage.loading) {
      _collaboration.socket.emit("client-update-node", {
        actions: e.detail,
        channel: _collaboration.channelName,
      });
    }
  }
}
