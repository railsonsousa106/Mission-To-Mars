exports.up = function (knex) {
  return knex.schema.createTable("boards", (table) => {
    table.increments("id").primary().unsigned();
    table.string("url").notNullable().unique();
    table.string("password").notNullable();
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("boards");
};
