module.exports = {
  up(migration, DataTypes, done) {
    // add altering commands here, calling 'done' when finished
    migration.addColumn("posts", "bumped_at", DataTypes.DATE);
    migration.addIndex('posts', ['bumped_at']);
    done();
  },
  down(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    migration.removeColumn("posts", "bumped_at");
    done();
  }
}
