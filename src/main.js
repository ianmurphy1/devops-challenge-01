const express = require('express');
const mysql = require('mysql2');
const semver = require('semver');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const bodyParser = require('body-parser');
const jwtSecret = fs.readFileSync(process.env.JWT_SECRET_FILE, 'utf8').trim();
const { body, validationResult } = require('express-validator');
const CreateRelease = require('./models/CreateRelease');
const ListReleases = require('./models/ListReleases');
const Login = require('./models/Login');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// MySQL database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: fs.readFileSync(process.env.DB_PASSWORD_FILE, 'utf8').trim(),
    database: process.env.DB_DATABASE
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database.');
});

const login = (db) => (req, res) => {
    let login;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json(errors.array());
    }
    try {
        login = new Login(req.body);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }

    const query = 'SELECT id, username, password FROM users WHERE username = ? AND password = ?;';
    db.query(query, [login.username, login.password], (err, result) => {
        if (err) {
            console.error('Error logging user in');
            return res.status(500).json({error: 'Error logging in'});
        }
        if (result.length === 0) {
            return res.status(400).json({error: 'Username or password incorrect'})
        }
        const token = jwt.sign(
            result[0],
            jwtSecret,
            { expiresIn: '2h' }
        );
        res.status(200).json({token});
    });
};

const auth = (req, res, next) => {
    const header = req.header('Authorization');
    if (!header) {
        return res.status(400).json({error: 'Missing auth header'});
    }
    const token = header.split(' ')[1];
    jwt.verify(token, jwtSecret, (err, decoded) => {
        if (err) {
            return res.status(401).json({error: err.message});
        }
        next();
    });
};


// Route to create a new release
const createReleaseRoute = (db) => (req, res) => {
    let createRelease;

    try {
        createRelease = new CreateRelease(req.body);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }

    const query = 'INSERT INTO releases (name, version, account, region) VALUES (?, ?, ?, ?)';
    db.query(query, [createRelease.name, createRelease.version, createRelease.account, createRelease.region], (err, result) => {
        if (err) {
            console.error('Error inserting release:', err);
            return res.status(500).json({ error: 'Failed to create release.' });
        }
        res.status(201).json({ message: 'Release created successfully.', releaseId: result.insertId });
    });
};

// Route to get all releases with pagination
const listReleasesRoute = (db) => (req, res) => {
    let listReleases;

    try {
        listReleases = new ListReleases(req.query);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }

    const query = 'SELECT * FROM releases ORDER BY created_at DESC LIMIT ? OFFSET ?';
    db.query(query, [listReleases.limit, listReleases.offset], (err, results) => {
        if (err) {
            console.error('Error fetching releases:', err);
            return res.status(500).json({ error: 'Failed to fetch releases.' });
        }
        res.status(200).json(results);
    });
};

const detectDriftRoute = (db) => (req, res) => {
    // application one 3.0.1 is in all environments except prod 5
    // application three 3.2.1 is missing in all secondary regions on prod
    //  application four 4.4.4 is missing in prod_four primary
    // application eight 3.6.9 is only in staging and prod_five
    //  application ten 5.0.0 is only in staging
    const query = 'SELECT name, account, region, version FROM releases ORDER BY id DESC, version DESC;';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error getting drift');
            return res.status(500).json({ error: 'Failed' });
        }
        const unique = results.filter((obj, index, self) => {
            return self.findIndex(o => {
                return o.name === obj.name && o.account === obj.account && o.region === obj.region;
            }) === index;
        });

        let latestVersions = unique.filter(obj => {
            return obj.account === 'staging' && obj.region === 'primary';
        });

        latestVersions = latestVersions.map(obj => {
            const { name, version } = obj;
            return { [name]: {latest: version} };
        });

        const drift = latestVersions.map(obj => {
            const appKey = Object.keys(obj)[0];
            const presentVersions = unique.filter(o => {
                return appKey === o.name;
            });
            const newObj = presentVersions.reduce((result, item) => {
                const latestVersion = obj[appKey].latest;
                if (semver.lt(item.version, latestVersion)) {
                    if (!result[item.account]) {
                        result[item.account] = {};
                    }
                    result[item.account] = {
                        ...result[item.account],
                        ...{[item.region]: item.version}
                    }; 
                }
                return result;
            }, {});

            let result = { ...obj };

            if (Object.keys(newObj).length !== 0) {
                result[appKey].drift = newObj;
            }
            return result;
        }).filter(obj => {
            const appKey = Object.keys(obj)[0];
            return obj[appKey].drift !== undefined;
        });

        return res.status(200).json(drift);
    });
};

const loginValidator = [
    body('username').exists({ checkFalsy: true }).notEmpty(),
    body('password').exists().notEmpty(),
];
app.post('/login', loginValidator, login(db));

// All endpoints from here use authorisation header
// so add middleware once to avoid adding to each
// endpoint individually
app.use(auth);
// Inject dependencies into routes
app.post('/release', createReleaseRoute(db));
app.get('/releases', listReleasesRoute(db));
app.get('/drift', detectDriftRoute(db));

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
