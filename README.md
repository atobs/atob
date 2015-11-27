

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


    # RUN THIS COMMAND ONCE (THE FIRST TIME)
    PORT=8001 RESET=1 node app 

    # RUN THIS COMMAND ANY OTHER TIME
    PORT=8001 node app

PRUNING ATOB
------------

run scripts/clean\_old\_posts.sh from the main directory to delete and archive
old posts and remove old IPs. This should be done regularly in a cronjob

SETTING UP NGINX
----------------


An example NGINX sites-available config might look like:

    server {
      listen 80;

      # using SSL (OPTIONAL)
      listen 443 ssl;
      ssl_certificate    /home/dev/atob/config/bak/signed.crt;
      ssl_certificate_key    /home/dev/atob/config/bak/server.key;
      # end SSL

      server_name atob.xyz;
      server_name atob.cc;

      location / {
         # assume the app is running on 8001
         proxy_pass      http://127.0.0.1:8001;


         # web socket and proxy header stuff
         proxy_http_version 1.1;
         proxy_set_header Upgrade $http_upgrade;
         proxy_set_header Connection "upgrade";
         proxy_redirect          off;
         proxy_set_header        Host            $host;
         proxy_set_header        X-Real-IP       $remote_addr;
         proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;

         client_max_body_size    10m;
         client_body_buffer_size 2k;
         proxy_buffers           32 4k;
      }
    }

