import User from "../models/user.js";
// IMPORTANT NOTE!!!: User Model is dependency for all authenticated routes
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_KEY);

export const quickartElitePage = async (req , res) => {
    try {
        if (req.isAuthenticated()) {
            // BUSINESS LOGIC YET TO BE IMPLEMENTED
            res.render('quickartElitePage');
        } else {
            res.redirect('/auth/login');
        }
    } catch (error) {
        res.render('server-error');
        console.log(error);
    }
}

export const quickartEliteBilling = async (req,res) => {
    if(req.isAuthenticated()) {
        try {
            if (req.user.newSubscriber && req.user.verified && req.user.stripeCustomerId == undefined) {
                const createCustomer = await stripe.customers.create({
                    name: req.user.name,
                    email: req.user.email,
                });

                const updateCustomer = await User.findOneAndUpdate({_id : req.user._id} , {stripeCustomerId : createCustomer.id} ,  { new: true }).exec();
            } 
            
            //Fetch user

            const user = await User.findOne({_id : req.user._id}).exec();
            
            const session = await stripe.checkout.sessions.create({
                customer : user.stripeCustomerId,
                mode : 'subscription',
                line_items : [
                    {
                        price : 'price_1PiHFQJw3C6dTi69FSGpWK8G',
                        quantity : 1
                    }
                ],
                allow_promotion_codes: false,
                success_url : `${process.env.DOMAIN}/subscription-payment-handler?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url : `${process.env.DOMAIN}/quickart-elite/billing?paymentFailure=1`,
            });
            res.redirect(session.url);
        } catch (error) {
            console.log(error);
            res.render('server-error');
        }
    } else {
        res.redirect('/auth/login');
    }
}

export const subscriptionPaymentHandler = async (req,res) => {
    if (req.isAuthenticated()){
        console.log(req.query);
        const sessionID = req.query.session_id;
        const session = await stripe.checkout.sessions.retrieve(sessionID);

        console.log(session);
        const subscriptionID = session.subscription;
        const subscription = await stripe.subscriptions.retrieve(subscriptionID);
        res.json(subscription);

    } else {
        res.redirect('/auth/login');
    }
}