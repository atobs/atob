module.exports = {
  up(migration, DataTypes, done) {
    // add altering commands here, calling 'done' when finished
    // add altering commands here, calling 'done' when finished
    migration.createTable('Links', {
      id: { type: DataTypes.INTEGER, primaryKey: true },
      ip: DataTypes.STRING,
      ups: DataTypes.INTEGER,
      href: DataTypes.STRING,
      title: DataTypes.STRING,
      downs: DataTypes.INTEGER,
      image: DataTypes.BOOLEAN,
      author: DataTypes.STRING,
      tripcode: DataTypes.STRING,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      post_id: DataTypes.INTEGER,
      board: DataTypes.STRING
    });
    done()
  },
  down(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    migration.dropTable('Links');
    done()
  }
}
