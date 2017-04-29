module.exports = {
  up(migration, DataTypes, done) {
    // add altering commands here, calling 'done' when finished
    migration.addColumn("posts", "burtles", DataTypes.INTEGER);
    done()
  },
  down(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    migration.removeColumn("posts", "burtles");
    done()
  }
}
