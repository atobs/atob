cp db.sqlite db.sqlite.bak

for i in bak/*.sqlite; do
  echo $i;
  cp $i db.sqlite
  node scripts/garbage_collection.js
done

cp bak/003.bak db.sqlite
node scripts/garbage_collection.js

cp db.sqlite.bak db.sqlite

rm db.sqlite.bak
