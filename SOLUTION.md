# Solution
## Build and Run
When in the repo directory:
```
docker compose build
```
The following with start the mysql database instance and the app, healthcheck within the `mysql` service in the `compose.yaml` file will make the app wait for the db container to initialise before starting.  
```
docker compose up -d
```

To destroy the services:
```
docker compose down
```
The mysql has a docker volume that is mapped to the database data directory so starting and stopping the compose project won't wipe the data in the database when restarting the project after a build of the app. To destroy the volume to start with a fresh db then the above command with `-v` added to it will destroy the volume along with the containers and network.

## Requests
All endpoints are protected by authorization that requires a JWT to be included in the header of the request, there is a new endpoint added in (`/login`) that can be used to generate a token to be used in requests.

**Note: `jq` is used in these requests so it should be installed prior to running them or remove jq from the commands**

### Login
```
TOKEN=$(curl -s -X POST localhost:3000/login -H 'Content-Type: application/json' -d '{"username":"bart","password":"cowabunga1"}' | jq -r '.token')
```

### List Releases
```
curl -s localhost:3000/releases -H "Authorization: Bearer: ${TOKEN}" | jq
```
### Create Release
```
curl -X POST -s \
  localhost:3000/release \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer: ${TOKEN}" \
  -d '{"name": "application_one","version":"3.0.2","account":"staging","region":"primary"}'
```
### Drift
```
curl -s localhost:3000/drift -H "Authorization: Bearer: ${TOKEN}" | jq
```

## Changes and Additions
The following is a list of changes or additions to the provided project where the reasons are security and ease of use: 
* Minimal `nodejs` image largely derived from the following: [OWASP NodeJS Image](https://cheatsheetseries.owasp.org/cheatsheets/NodeJS_Docker_Cheat_Sheet.html)
* Added in `/login` endpoint to generate bearer token for authorisation
    * Request body validation by `express-validator`
* JWT protected endpoints through authorisation header
* `/drift` endpoint implemented
    * For this endpoint the version in the `staging` account and `primary` region was taken as the latest version of an individual application
* docker secrets for all values that need to be protected
    * While these secrets are included and pushed into github for this exercise these would be better off in a secret vault and retrieved at either deploy time (for mysql initialisation) or run time to prevent public exposure. Given the use of AWS services within Servisbot - Secrets Manager would be ideal for these secret values to be stored in.
* MySQL container isolated from host network
* Moved `users` and `releases` tables from separate databases into a single database to make interacting with the database easier in the app
* Created app specific database user which has very limited privileges within the database, only `SELECT` permissions on the users table to allow logging in, `SELECT`, `UPDATE` and `INSERT` on the releases table to allow the use of the release related endpoints
