module.exports = {
  up: function(migration, DataTypes, done) {
    // add altering commands here, calling 'done' when finished
    migration.addColumn("trophies", "anon_id", DataTypes.INTEGER);
    done();
  },
  down: function(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    migration.removeColumn("trophies", "anon_id");
    done();
  }
}
