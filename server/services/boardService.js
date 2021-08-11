const _ = require("lodash");
const Board = require("../models/board");

class BoardService {
  static async getByURL(url) {
    const board = await Board.where({ url }).fetch();
    return board;
  }
  static async getByURLAndPassword(url, password) {
    const board = await Board.where({ url, password }).fetch();
    return board;
  }
}

module.exports = BoardService;
