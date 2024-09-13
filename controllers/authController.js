import User from "../models/user.js";
import passport from 'passport';
import Cart from "../models/cart.js";
import { randomUUID } from 'crypto';
import Token from '../models/token.js'
import sendMail from "../utils/postMaster.js";
import { response } from "express";

export const registerTrigger = async (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect("/")
    } else {
        User.register({
            username: req.body.username, name: req.body.name, email: req.body.username
        }, req.body.password, async function (err, user) {
            if (err) {
                if (err.name === 'UserExistsError') {
                    res.redirect('/auth/register?uax=true')
                } else {
                    res.status(500).render('server-error');
                    console.error('Error:', err);
                }
            } else {
                //check token before generating another one 
                const checkToken = await Token.findOne({ userId: user._id }).exec();

                if (checkToken) {
                    // if token is found delete it
                    const deleteToken = await Token.deleteOne({ userId: user._id }).exec();
                }

                //generate uuid
                const uuid = randomUUID();
                const newToken = new Token({
                    userId: user._id,
                    token: uuid,
                    tokenType: 'VERIFY_EMAIL'
                });
                await newToken.save();

                const newCart = new Cart({ user: user._id, items: [] });
                await newCart.save();

                const event = new Date();
                const timestamp = event.toLocaleString('en-IN', { timeZone: 'IST' });

                const verifyLink = `${process.env.DOMAIN}/auth/verify-token?tokenID=${uuid}&tokenType=VERIFY_EMAIL`;
                await sendMail(user.email, 'Verify Email', 'templates/mailer/verify-email-template.ejs', { name: user.name, verifyLink: verifyLink, timestamp: timestamp });
                
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/");
                });
            }
        });
    }
}



export const requestForgotPasswordProcess = async (req, res) => {
    try {
        if (req.isAuthenticated()) {
            return res.redirect("/");
        }
        const email = req.body.email;
        //Find user in DB
        const user = await User.findOne({ email: email }).exec();

        if (!user) {
            return res.redirect('/auth/forgot-password?emailSent=true');
        }

        //check token before generating another one 
        const checkToken = await Token.findOne({ userId: user._id }).exec();

        if (checkToken) {
            // if token is found delete it
            const deleteToken = await Token.deleteOne({ userId: user._id }).exec();
        }

        //generate uuid
        const uuid = randomUUID();

        //create document in DB

        const newToken = new Token({
            userId: user._id,
            token: uuid,
            tokenType: 'RESET',
        });

        await newToken.save();

        const resetLink = `${process.env.DOMAIN}/auth/verify-token?tokenID=${uuid}&tokenType=RESET`;

        res.redirect('/auth/forgot-password?emailSent=true');

        // SEND EMAIL
        const event = new Date();
        const timestamp = event.toLocaleString('en-IN', { timeZone: 'IST' });
        await sendMail(user.email, 'Forgot Password', 'templates/mailer/forgot-password-template.ejs', { name: user.name, resetLink: resetLink, timestamp: timestamp });
    } catch (error) {
        res.render('server-error');
        console.log(error);
    }
}


export const changePasswordProcess = async (req, res) => {
    try {
        const foundToken = await Token.findOne({ token: req.body.token, tokenType: 'RESET' }).exec();

        if (foundToken) {

            const foundUser = await User.findOne({ _id: foundToken.userId }).exec();

            if (!foundUser) {
                return res.render('404');
            }

            if (req.body.password1 === req.body.password2) {
                const resetPass = await foundUser.setPassword(req.body.password2);
                const saveUser = await foundUser.save();
                res.redirect('/auth/login?passwordChanged=true');


                const link = `${process.env.DOMAIN}/auth/login`;
                // SEND EMAIL
                const event = new Date();
                const timestamp = event.toLocaleString('en-IN', { timeZone: 'IST' });
                await sendMail(foundUser.email, 'Account Update - Password Changed', 'templates/mailer/password-changed-template.ejs', { name: foundUser.name, link: link, timestamp: timestamp });

                const deleteToken = await Token.deleteOne({ userId: foundUser._id }).exec();

            } else {
                res.redirect('/auth/forgot-password?passwordMismatch=true');
            }
        } else {
            return res.render('404');
        }
    } catch (error) {
        res.render('server-error');
        console.log(error);
    }
}

export const verifyToken = async (req, res) => {
    try {
        const tokenReason = req.query.tokenType;
        const tokenID = req.query.tokenID;

        if (tokenReason === 'VERIFY_EMAIL') {
            const foundToken = await Token.findOne({ token: tokenID, tokenType: tokenReason }).exec();

            if (foundToken) {
                const updateUser = User.findOneAndUpdate({_id : foundToken.userId} , {verified : true}).exec();

                const deleteToken = await Token.deleteOne({ userId: foundToken.userId }).exec();

                return res.render('token-response' , {response : true});
            }
            return res.render('token-response' , {response : false});
        } else if (tokenReason === 'RESET') {

            const foundToken = await Token.findOne({ token: tokenID, tokenType: tokenReason }).exec();

            if (foundToken) {
                return res.render('reset-password', { token: tokenID });
            }
            return res.render('token-response' , {response : false});
        } else {
            return res.render('404');
        }

    } catch (error) {
        res.render('server-error');
        console.log(error);
    }
}

export const getProfileDetails = async (req,res) => {
    if (req.isAuthenticated()){
        try {
            const user = req.user;
            res.render('profile' , {user : user});
        } catch (error) {
            res.render('server-error');
            console.log(error);
        }
    } else {
        res.redirect("/auth/login");
    }
}

export const resendEmailVerification = async (req,res) => {
    if (req.isAuthenticated()){
        try {
            // if user is already verified redirect to home
            if (req.user.verified) {
                return res.redirect('/');
            }

            //check token before generating another one 
            const checkToken = await Token.findOne({ userId: req.user._id }).exec();

            if (checkToken) {
                // if token is found delete it
                const deleteToken = await Token.deleteOne({ userId: req.user._id }).exec();
            }

            //generate uuid
            const uuid = randomUUID();
            const newToken = new Token({
                userId: req.user._id,
                token: uuid,
                tokenType: 'VERIFY_EMAIL'
            });
            await newToken.save();

            const verifyLink = `${process.env.DOMAIN}/auth/verify-token?tokenID=${uuid}&tokenType=VERIFY_EMAIL`;

            res.redirect('/account/profile?emailSent=true');
            // send mail
            const event = new Date();
            const timestamp = event.toLocaleString('en-IN', { timeZone: 'IST' });

            await sendMail(req.user.email, 'Re: Verify Email', 'templates/mailer/verify-email-template.ejs', { name: req.user.name, verifyLink: verifyLink, timestamp: timestamp });

        } catch (error) {
            res.render('server-error');
            console.log(error);
        }
    } else {
        res.redirect('/auth/login');
    }
}