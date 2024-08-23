const UserModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const { signUpErrors, signInErrors } = require('../utils/errors.utils');

const maxAge = 3 * 24 * 60 * 60 * 1000;
const createToken = (id) => {
    return jwt.sign({id}, process.env.TOKEN_SECRET, {
        expiresIn: maxAge
    })
};

module.exports.signUp = async(req, res) => {
const {pseudo, email, password} = req.body

try{
    const user = await UserModel.create({pseudo, email, password});
    res.status(201).json({ msg : " register succesfully", user});
}
catch(err) {
    const errors = signUpErrors(err);
    res.status(200).send({ errors })
}
}

module.exports.signIn = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await UserModel.login(email, password);
        const token = createToken(user._id);
      const maxAge = 1 * 60 * 60 * 1000;
        res.cookie("jwt", token, {
        httpOnly: true,
        maxAge,
        secure: true,
        sameSite: "Strict",
    });

        res.status(200).send({ msg: "login successfully", user: user.id});
    } catch (err) {
        const errors = signInErrors(err);
        res.status(400).json({ errors });
    }
};

module.exports.logout = (req, res) => {

    res.cookie("jwt", "", {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        maxAge: 1,
    });

res.send({msg: "logout successfully"})

};
