

WHAT
====

atob is a realtime textboard. this is the source code for it.



HOWTO
=====

INSTALL ATOB
------------

make sure node / npm are installed. then run `npm install`


RUNNING ATOB
------------

The first time you run atob, you need to create the database by specifying
RESET=true on the command line. After the first run, you should NOT use
the RESET parameter again, unless you want to delete your data. 


The two relevant commands are:


    PORT=8001 RESET=1 node app 
    PORT=8001 node app


PRUNING ATOB
------------

run scripts/clean\_old\_posts.sh from the main directory to delete and archive
old posts and remove old IPs. This should be done regularly in a cronjob
