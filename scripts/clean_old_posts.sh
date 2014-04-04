NOW=`date +"%Y-%m-%d-%R"`
mkdir bak 2> /dev/null
cp db.sqlite bak/${NOW}.sqlite
node scripts/garbage_collection.js >> garbage_collector.log
echo "vacuum;" | sqlite3 db.sqlite
