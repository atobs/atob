module.exports = {
  up(migration, DataTypes, done) {
    // add altering commands here, calling 'done' when finished
    migration.createTable('IPs', {
      id: DataTypes.INTEGER,
      ip: DataTypes.STRING,
      browser: DataTypes.STRING,
      post_id: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE
    });
    done();
  },
  down(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    migration.dropTable('ips');
    done();
  }
}
