// const pusher = require("../utils/pusher");
// const CardStateService = require("../services/cardStateService");

// class PusherController {
//   static auth(req, res) {
//     const socketId = req.body.socket_id;
//     const channel = req.body.channel_name;
//     const auth = pusher.authenticate(socketId, channel);
//     res.send(auth);
//   }

  

//   static async webhook(req, res) {
//     let events = req.body.events;
//     for (let event of events) {
//       if (event.event === "client-update-node") {
//         let data = JSON.parse(event.data);
//         console.log("-----");
//         console.log(data);
//         console.log(event.channel);
//         for (let detail of data) {
//           try {
//             const cardState = await CardStateService.getByChannelAndIndex(
//               event.channel,
//               detail.index
//             );
//             if (cardState) {
//               await CardStateService.updateCardStateByIndex(
//                 event.channel,
//                 detail.index,
//                 {
//                   state: JSON.stringify({
//                     type: detail.type,
//                     position: detail.position,
//                     text: detail.text,
//                     mode: detail.mode,
//                     visible: detail.visible,
//                     isClone: detail.isClone,
//                     selectable: detail.selectable
//                   }),
//                 }
//               );
//             }
//           } catch (error) {
//             if (error.message === "EmptyResponse") {
//               await CardStateService.createCardState({
//                 channelName: event.channel,
//                 cardIndex: detail.index,
//                 state: JSON.stringify({
//                   type: detail.type,
//                   position: detail.position,
//                   text: detail.text,
//                   mode: detail.mode,
//                   visible: detail.visible,
//                   isClone: detail.isClone,
//                   selectable: detail.selectable
//                 }),
//               });
//             } else {
//               res.status(500).json({
//                 message: error.message,
//               });
//             }
//           }
//         }
//       }
//     }
//     res.send("ok");
//   }
// }

// module.exports = PusherController;
