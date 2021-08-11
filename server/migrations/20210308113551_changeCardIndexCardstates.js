
exports.up = function(knex) {
  return knex.schema.table('cardstates', (table) => {
    table.string('cardIndex').notNullable().alter();
  });
};

exports.down = function(knex) {
  return knex.schema.table('cardstates', (table) => {
    table.integer("cardIndex").notNullable().alter();
  });
};
