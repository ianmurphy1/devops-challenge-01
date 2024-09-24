#!/usr/bin/env sh
set -e

sed "s,REPLACE_PASS,$(cat $MYSQL_APP_PASSWORD_FILE),g" /docker-entrypoint-initdb.d/init.sql > /docker-entrypoint-initdb.d/tmp
cat /docker-entrypoint-initdb.d/tmp > /docker-entrypoint-initdb.d/init.sql

rm ./docker-entrypoint-initdb.d/tmp
