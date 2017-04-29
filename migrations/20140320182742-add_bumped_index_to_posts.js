module.exports = {
  up(migration, DataTypes, done) {
    // add altering commands here, calling 'done' when finished
    migration.addIndex('posts', [ 'bumped_at'], { indexName: "bumpIndex" });
    migration.addIndex('posts', [ 'thread_id'], { indexName: "threadIndex" });
    migration.addIndex('posts', [ 'parent_id'], { indexName: "parentIndex" });
    migration.addIndex('posts', [ 'board_id'], { indexName: "boardIndex" });
    done()
  },
  down(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    migration.removeIndex('posts', [ 'bumped_at'], { indexName: "bumpIndex" });
    migration.removeIndex('posts', [ 'thread_id'], { indexName: "threadIndex" });
    migration.removeIndex('posts', [ 'parent_id'], { indexName: "parentIndex" });
    migration.removeIndex('posts', [ 'board_id'], { indexName: "boardIndex" });
    done()
  }
}
