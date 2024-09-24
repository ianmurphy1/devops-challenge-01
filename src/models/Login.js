class Login {
    constructor({ username, password } = {}) {
        if (!username || !password) {
            throw new Error('All fields are required');
        }
        this.username = username;
        this.password = password;
    }
}

module.exports = Login;
