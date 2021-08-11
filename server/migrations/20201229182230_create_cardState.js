exports.up = function (knex) {
  return knex.schema.createTable("cardstates", (table) => {
    table.increments("id").primary().unsigned();
    table.string("channelName").notNullable();
    table.integer("cardIndex").notNullable();
    table.text("state").notNullable();
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("cardstates");
};
