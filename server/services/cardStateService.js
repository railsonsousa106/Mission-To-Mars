const _ = require("lodash");
const CardState = require("../models/cardState");

class CardStateService {
  static async getByChannelAndIndex(channelName, cardIndex) {
    const cardState = await CardState.where({ channelName, cardIndex }).fetch();
    return cardState;
  }

  static async getListByChannelName(channelName) {
    const list = await CardState.where({ channelName: channelName }).fetchAll();
    return list;
  }

  static async getById(id) {
    const cardState = await CardState.where({ id }).fetch();
    return cardState;
  }

  static async createCardState(payload) {
    const cardState = await CardState.forge(payload).save();
    return _.omit(cardState.toJSON(), ["createdAt", "updatedAt"]);
  }

  static async updateCardStateById(id, payload) {
    const cardState = await this.getById(id);
    await cardState.save(payload);
    return cardState;
  }

  static async updateCardStateByIndex(channelName, cardIndex, payload) {
    const cardState = await this.getByChannelAndIndex(channelName, cardIndex);
    const updatedPayload = { ...payload };
    await cardState.save(updatedPayload);
    return cardState;
  }
}

module.exports = CardStateService;
