const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const config = require("./config");
const http = require("http");
// const PusherController = require("./controllers/pusherController");
const BoardController = require("./controllers/boardController");
const SocketServer = require("./utils/socket");

dotenv.config();

// Server
const app = express();

app.use(cors());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "..", "assets")));
// app.post("/pusher/auth", PusherController.auth);
// app.post("/webhook", PusherController.webhook);

app.post("/board/auth", BoardController.auth);
app.post("/board/checkURL", BoardController.checkURL);
app.get("/board/:channelName", BoardController.getListByChannelName);
// app.get("*", (_req, res) => {
//   res.sendFile(path.resolve(__dirname, "..", "index.html"));
// });

const server = http.createServer(app);
new SocketServer(server);

server.listen(config.port, () => {
  console.log(`Server listening at port ${config.port}.`);
});
