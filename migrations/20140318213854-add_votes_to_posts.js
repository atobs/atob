module.exports = {
  up(migration, DataTypes, done) {
    // add altering commands here, calling 'done' when finished
    migration.addColumn("posts", "downs", DataTypes.INTEGER);
    migration.addColumn("posts", "ups", DataTypes.INTEGER);
    done()
  },
  down(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    migration.removeColumn("posts", "downs");
    migration.removeColumn("posts", "ups");
    done();
  }
}
