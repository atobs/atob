module.exports = {
  up: function(migration, DataTypes, done) {
    // add altering commands here, calling 'done' when finished
    migration.createTable('BoardClaims', {
      board_id: { type: DataTypes.STRING },
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
      accepted: DataTypes.BOOLEAN,
      author: DataTypes.STRING,
      tripcode: DataTypes.STRING,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE
    });
    done();
  },
  down: function(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    migration.dropTable('BoardClaims');
    done()
  }
};
