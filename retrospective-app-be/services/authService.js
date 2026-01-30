const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const crypto = require('crypto');

const usersFile = path.join(config.dataFolder, 'users.txt');

class AuthService {
    // Hash password for security (simple simulation)
    hashPassword(password) {
        return crypto.createHash('sha256').update(password).digest('hex');
    }

    // Register new user
    register(userData) {
        const { username, email, password } = userData;

        // Validate required fields
        if (!username || !email || !password) {
            throw new Error('Username, email, and password are required');
        }

        // Check if user already exists
        if (this.userExists(email)) {
            throw new Error('User with this email already exists');
        }

        // Create user object
        const user = {
            id: Date.now(),
            username,
            email: email.toLowerCase(),
            password: this.hashPassword(password),
            createdAt: new Date().toISOString()
        };

        // Save to file
        fs.appendFileSync(usersFile, JSON.stringify(user) + '\n');

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    // Login user
    login(email, password) {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        const user = this.getUserByEmail(email.toLowerCase());

        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Verify password
        const hashedPassword = this.hashPassword(password);
        if (user.password !== hashedPassword) {
            throw new Error('Invalid email or password');
        }

        // Generate session token (simple simulation)
        const token = crypto.randomBytes(32).toString('hex');
        const session = {
            token,
            userId: user.id,
            email: user.email,
            username: user.username,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        };

        // Return user info and token
        const { password: _, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
        };
    }

    // Check if user exists
    userExists(email) {
        const user = this.getUserByEmail(email.toLowerCase());
        return user !== null;
    }

    // Get user by email (helper method for login)
    getUserByEmail(email) {
        if (!fs.existsSync(usersFile)) return null;

        const users = fs.readFileSync(usersFile, 'utf-8')
            .split('\n')
            .filter(Boolean)
            .map(line => JSON.parse(line));

        return users.find(u => u.email === email.toLowerCase()) || null;
    }
}

module.exports = new AuthService();