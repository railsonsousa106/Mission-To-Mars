var uniqid = require('uniqid');

exports.up = function(knex) {
    let data = [];
    for (let i = 0; i < 100; i ++) {
        data.push({
            url: uniqid(),
            password: uniqid.time()
        });
    }

    knex("boards").insert(data);
};

exports.down = function(knex) {
  
};
