module.exports = {
  up: function(migration, DataTypes, done) {
    // add altering commands here, calling 'done' when finished
  migration.createTable('Actions', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    object: DataTypes.STRING,
    actor: DataTypes.STRING,
    action: DataTypes.STRING,
    count: DataTypes.INTEGER,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  });

    done();
  },
  down: function(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    migration.dropTable('Actions');
    done()
  }
}
