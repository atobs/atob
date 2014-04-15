NOW=`date +"%Y-%m-%d-%R"`
mkdir bak 2> /dev/null
cp db.sqlite bak/${NOW}.sqlite
/usr/bin/node scripts/garbage_collection.js >> garbage_collector.log
echo "vacuum;" | /usr/bin/sqlite3 db.sqlite
