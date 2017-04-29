module.exports = {
  up(migration, DataTypes, done) {
    // add altering commands here, calling 'done' when finished
    migration.createTable('Bans', {
      id: DataTypes.INTEGER,
      ip: DataTypes.STRING,
      from: DataTypes.STRING,
      browser: DataTypes.STRING,
      tripcode: DataTypes.STRING,
      reason_id: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      post_id: DataTypes.INTEGER,
      hours: DataTypes.INTEGER,
      board: DataTypes.STRING
    });
    done();
  },
  down(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    migration.dropTable('Bans');
    done();
  }
}
