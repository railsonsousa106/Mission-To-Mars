const BoardService = require("../services/boardService");
const CardStateService = require("../services/cardStateService");

class BoardController {
  static async auth(req, res) {
    const { url, password } = req.body;
    try {
      const board = await BoardService.getByURLAndPassword(url, password);
      if (board) {
        res.status(200).json({
          success: true,
        });
      } else {
        res.status(200).json({
          success: false,
        });
      }
    } catch (error) {
      if (error.message === "EmptyResponse") {
        res.status(200).json({
          success: false,
        });
      } else {
        res.status(500).json({
          message: error.message,
        });
      }
    }
  }
  static async getListByChannelName(req, res) {
    const channel = req.params.channelName;
    try {
      const cardStates = await CardStateService.getListByChannelName(channel);
      if (cardStates) {
        res.status(200).json({
          list: cardStates.toJSON(),
        });
      }
    } catch (error) {
      if (error.message === "EmptyResponse") {
        res.status(200).json({
          list: [],
        });
      } else {
        res.status(500).json({
          message: error.message,
        });
      }
    }
  }
  static async checkURL(req, res) {
    const { url } = req.body;
    try {
      const board = await BoardService.getByURL(url);
      if (board) {
        res.status(200).json({
          success: true,
        });
      }
    } catch (error) {
      if (error.message === "EmptyResponse") {
        res.status(200).json({
          success: false,
        });
      } else {
        res.status(500).json({
          message: error.message,
        });
      }
    }
  }
}

module.exports = BoardController;
