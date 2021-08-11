const socket = require("socket.io");
const CardStateService = require("../services/cardStateService");

class SocketServer {
  constructor(server) {
    this.io = socket(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
    this.shapes = [];
    this.io.on("connection", this.onConnection.bind(this));
  }
  initClient(socket) {
    console.log("New client connected");

    // for (let i in this.shapes) {
    //   socket.emit("draw_shape", this.shapes[i]);
    // }
  }
  onConnection(socket) {
    this.initClient(socket);
    socket.on("client-update-node", (data) =>
      this.onClinetUpdateNode.bind(this)(socket, data)
    );
  }

  async onClinetUpdateNode(socket, data) {
    socket.broadcast.emit("client-update-node", data);

    for (let detail of data.actions) {
        try {
        const cardState = await CardStateService.getByChannelAndIndex(
            data.channel,
            detail.index
        );
        if (cardState) {
            await CardStateService.updateCardStateByIndex(
            data.channel,
            detail.index,
            {
                state: JSON.stringify({
                type: detail.type,
                position: detail.position,
                text: detail.text,
                mode: detail.mode,
                visible: detail.visible,
                isClone: detail.isClone,
                selectable: detail.selectable
                }),
            }
            );
        }
        } catch (error) {
        if (error.message === "EmptyResponse") {
            await CardStateService.createCardState({
            channelName: data.channel,
            cardIndex: detail.index,
            state: JSON.stringify({
                type: detail.type,
                position: detail.position,
                text: detail.text,
                mode: detail.mode,
                visible: detail.visible,
                isClone: detail.isClone
            }),
            });
        } else {
          console.log(error.message);
        }
      }
    }
  }
}

module.exports = SocketServer;
