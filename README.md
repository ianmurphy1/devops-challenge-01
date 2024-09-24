# DevSecOps Take-Home Exercise

## Welcome!
Thank you for taking the time to participate in this code challenge!

Feel free to fork this repo, or create your own repo and complete the task below.

### Note
- You are free to use whatever technologies you wish to complete the task
- You are not required to produce a production ready application, this is a chance to showcase your abilities - so do try show what you know!
- Additions/Modifications to the existing codebase are allowed (within reason) but must be justified and documented in the `SOLUTION.md` file
- Comments or notes in general are more than welcome

## Overview

This repository contains a Node.js application that interacts with a MySQL database to manage application releases across various environments (accounts and regions). The goal of this exercise is to containerise the solution and help identify "drift" in production environments — cases where the latest version of an application is not deployed to all accounts and regions. Your tasks will involve enhancing the application, securing the infrastructure, and implementing drift detection.

### Existing Schema

The `releases` table schema in the MySQL database is as follows:

```sql
CREATE TABLE releases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,                     -- The name of the application
    version VARCHAR(50) NOT NULL,                   -- The version of the application
    account VARCHAR(255) NOT NULL,                  -- The account in which the app is deployed
    region VARCHAR(100) NOT NULL                    -- The region in which the app is deployed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- The timestamp when the release was created
);
```
    

The table tracks various deployments of applications across multiple accounts and regions. Each row represents a release of an application in a specific account and region.
There are ten unique applications (name), there are n number of versions for each application, and each application can be deployed in multiple accounts and regions.
There is one staging account and five production accounts, each account has two regions - primary and secondary.

### Applications
- application_one
- application_two
- application_three
- application_four
- application_five
- application_six
- application_seven
- application_eight
- application_nine
- application_ten

### Accounts and Regions
- staging
    - primary
    - secondary
- prod_one
    - primary
    - secondary
- prod_two
    - primary
    - secondary
- prod_three
    - primary
    - secondary
- prod_four
    - primary
    - secondary
- prod_five
    - primary
    - secondary

## Current State

The application currently has two main routes:
- `POST /createRelease`: Creates a new release for an application.
- `GET /listReleases`: Lists all releases in the database.

Additionally, there is a drift detection endpoint:
- `GET /drift`: This endpoint is supposed to detect and return environments (accounts/regions) where the latest version of an application is not deployed. Currently, this endpoint returns a hardcoded JSON object as a placeholder (snippet below):

```json
[
        { 
            "application_one": {
                "latest" : "3.0.1",
                "drift": {
                    "prod_five" : { "primary": "2.9.9", "secondary": "2.9.9" }
                }
            }
        }
]
```

Your task is to implement the logic to accurately detect drift and enhance other aspects of the system as detailed below.

## Tasks

### 1. Containerization
- Use **Docker** and **Docker Compose** to containerize the Node.js application and MySQL database.
- Ensure both services can communicate within a Docker network.
- The MySQL container should be initialized using the provided SQL scripts which can be found in the mysql folder.

### 2. Implement the Drift Detection Logic
- **Enhance the `/drift` Endpoint**:
  - Implement the logic to detect drift in the `GET /drift` endpoint.
  - The endpoint should return a list of applications that are not running the latest version in every `account` and `region`.
  - Expected output format should match the example snippet shown above (see placeholder data in code)
  - The drift detection logic should be optimized for security, performance and efficiency.

### 3. Secure the Node.js Application
- **a) Authentication**:
  - Add an API key authentication middleware to one or more endpoints. A basic API key implementation is acceptable, but ensure the key is passed securely in request headers.
- **b) Input Sanitization**:
  - Sanitize inputs to prevent SQL injection attacks.
  - Use parameterized queries for all database interactions.

### 4. Secure the MySQL Database
- **a) Secure the Root User**:
  - Set a complex root password for the MySQL instance.
- **b) Create a MySQL User with Limited Privileges**:
  - Create a new MySQL user that has only the necessary privileges (e.g., `SELECT`, `INSERT`, `UPDATE`) on the `releases` table.
  - Update the Node.js application to use this new user for database interactions.

### 5. Secure the Docker Containers
- Implement best practices for Docker security:
  - Use a minimal base image for the Node.js application to reduce the attack surface.
  - Run the Node.js application as a non-root user inside the container.
  - Use Docker secrets to store sensitive information like database passwords.
- Document any other security measures you implement for containerization.
- Although it is best practice in production. You do not need to isolate the MySQL container from the host network.

### 6. Document the Solution
- Create a `SOLUTION.md` file that includes:
  - Instructions for building and running the application using Docker Compose.
  - Sample (working) `curl` commands for testing the API endpoints (`/createRelease`, `/listReleases`, and `/drift`).
  - Describe the security measures you took to protect the application, database, and Docker setup.

## Deliverables
- A working `docker-compose.yml` file.
    -  `docker-compose up` should reliably start the Node.js application and MySQL database without errors.
- An updated Node.js application with:
  - A fully implemented `/drift` endpoint.
  - Authentication on one or more endpoints.
  - Input sanitization to prevent SQL injection.
- Database updates to add a new MySQL user and secure the root account.
- Documentation in `SOLUTION.md` explaining how to run the solution, including commands and any security practices you applied.

## Assessment Criteria
- **Correctness**: Does the `/drift` endpoint correctly identify environments where the latest application version is not deployed?
- **Security**: Have appropriate measures been implemented to secure the application, database, and containers?
- **Performance**: Is the drift detection logic optimized to handle large datasets efficiently?
- **Documentation**: Are the steps to build, run, and test the application clearly documented?

Good luck! Feel free to be creative with your implementation, but ensure that all security practices and design decisions are thoroughly documented.

---
