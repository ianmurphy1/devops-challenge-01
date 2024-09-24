FROM mysql:8.4.2

COPY --chown=mysql:mysql *.sql *.sh /docker-entrypoint-initdb.d/

RUN chown -R mysql:mysql /docker-entrypoint-initdb.d/
