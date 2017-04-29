var Sequelize = require("sequelize");
var archive = new Sequelize('database', 'username', 'password', {
  dialect: 'sqlite',
  storage: 'ab.sqlite',
  define: {
    sync: { force: true },
    underscored: true
  }
});

module.exports = {
  up(migration, DataTypes, done) {
    // add altering commands here, calling 'done' when finished
    var old_migrator = migration.migrator.sequelize;
    migration.migrator.sequelize = archive;
    migration.queryInterface.sequelize = archive;

    migration.createTable('ArchivedPosts', {
      id: DataTypes.INTEGER,
      board_id: DataTypes.STRING,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      title: DataTypes.STRING,
      text: DataTypes.TEXT,
      thread_id: DataTypes.INTEGER,
      parent_id: DataTypes.INTEGER,
      tripcode: DataTypes.STRING,
      author: DataTypes.STRING,
      replies: DataTypes.INTEGER,
      downs: DataTypes.INTEGER,
      ups: DataTypes.INTEGER,
      bumped_at: DataTypes.DATE
    }, {
      storage: 'ab.sqlite',
      dialect: 'sqlite'
    });

    migration.migrator.sequelize = old_migrator;
    migration.queryInterface.sequelize = old_migrator;
    done();
  },
  down(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    var old_migrator = migration.migrator.sequelize;
    migration.migrator.sequelize = archive;
    migration.queryInterface.sequelize = archive;
    migration.dropTable("ArchivedPosts", { storage: 'ab.sqlite' });
    migration.migrator.sequelize = old_migrator;
    migration.queryInterface.sequelize = old_migrator;
    done();
  }
}
