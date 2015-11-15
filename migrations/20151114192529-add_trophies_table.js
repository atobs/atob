module.exports = {
  up: function(migration, DataTypes, done) {
    // add altering commands here, calling 'done' when finished
  migration.createTable('Trophies', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    trophy: DataTypes.STRING,
    actor: DataTypes.STRING,
    anon: DataTypes.STRING,
    post_id: DataTypes.INTEGER,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE
  });

    done();
  },
  down: function(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    migration.dropTable('Trophies');
    done()
  }
}
