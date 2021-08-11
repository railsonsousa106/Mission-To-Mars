const bookshelf = require("../config/bookshelf");

/**
 * CardState model.
 */

const CardState = bookshelf.model("CardState", {
  tableName: "cardstates",
  hasTimestamps: ["createdAt", "updatedAt"],
});

module.exports = CardState;
