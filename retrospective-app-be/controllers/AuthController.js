const bcrypt = require("bcrypt");
const { createAccessToken } = require("../middlewares/auth");
const User = require("../models/Users");

exports.initiateRegister = async (req, res) => {
    try {
        const required = ["username", "email", "password"];
        const missing = required.filter((f) => !req.body[f]);

        if (missing.length) {
            return res.status(400).send({
                message: "All fields are required",
                missingFields: missing
            });
        }

        const {
            username,
            email,
            password
        } = req.body;

        if (!email.includes("@")) {
            return res.status(400).send({
                message: "Email invalid"
            });
        }

        if (password.length < 8) {
            return res.status(400).send({
                message: "Password must be at least 8 characters"
            });
        }
      
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).send({
                message: "Email already registered"
            });
        }
       
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(409).send({
                message: "Username is already taken! Please provide another one."
            })
        }
        

        const passwordHashed = bcrypt.hashSync(password, 10)

        const newUser = new User({
            username,
            email,
            password: passwordHashed
        });

        await newUser.save();

        const token = createAccessToken(newUser);
        
        return res.status(201).send({
            message: `Registration complete. Welcomem ${newUser.username}`,
            token,
            user: {
                _id: newUser._id,
                username: newUser.username,
                email: newUser.email
            }
        });
    } catch (err) {
        console.error(`Registration Error: ${err}`)
        return res.status(500).send({
            mesage: "Server error during registration"
        });
    }
}

exports.loginUser = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body
        const user = await User.findOne({ email });

        if(!user) {
            return res.status(400).send({
                message: "Invalid email or password"
            });
        }

        const isPasswordCorrect = bcrypt.compareSync(password, user.password);
        if(!isPasswordCorrect) {
            return res.status(401).send({
                message: "Invalid email or password"
            });
        }

        const token = createAccessToken(user);
        return res.status(200).send({
            message: "Login successful",
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (err) {
        console.error(`Login Error: ${err}`);
        return res.status(500).send({
            message: "Server error during login"
        });
    }
}