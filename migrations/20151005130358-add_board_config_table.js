module.exports = {
  up(migration, DataTypes, done) {
    // add altering commands here, calling 'done' when finished
    migration.createTable('BoardConfigs', {
      board_id: { type: DataTypes.STRING, primaryKey: true},
      config: DataTypes.TEXT,
      author: DataTypes.STRING,
      tripcode: DataTypes.STRING,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE
    });
    done();
  },
  down(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    migration.dropTable('BoardConfigs');
    done()
  }
};
