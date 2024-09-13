import 'dotenv/config'
import mongoose from "mongoose";
import passport from 'passport';
import express from "express";
import bodyParser from "body-parser";
import session from 'express-session';
import { rateLimit } from 'express-rate-limit'
import { checkVerified } from './middlewares/verifiedProfileMiddleware.js';
import ejs from "ejs";
import Product from "./models/product.js";
import MongoStore from 'connect-mongo'

//Routes importing
import storeRoutes from './routes/storeRoutes.js'
import cartRoutes from './routes/cartRoutes.js'
import authRoutes from './routes/authRoutes.js'
import accountRoutes from './routes/accountRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_KEY);
import { webHookController } from './controllers/webhookController.js';
import './utils/cronJobs.js'
const app = express();


const limiterForApp = rateLimit({
	windowMs: 3 * 60 * 1000, 
	limit: 100, 
	standardHeaders: true,
	legacyHeaders: false, 
    handler: (req, res, next, options) =>
		res.status(options.statusCode).render('429')
});

const limiterForAuth = rateLimit({
	windowMs: 8 * 60 * 1000, 
	limit: 30, 
	standardHeaders: true, 
	legacyHeaders: false,
    handler: (req, res, next, options) =>
		res.status(options.statusCode).render('429')
});

app.use(session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));

app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));



//mongoose initialization

mongoose.set("strictQuery", false);
mongoose.set("useNewUrlParser", true);
mongoose.set("useUnifiedTopology", true)
mongoose.set('useCreateIndex', true);

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};


app.use("/", limiterForApp, storeRoutes);
app.use("/", limiterForApp , cartRoutes);
app.use("/auth", limiterForAuth , authRoutes);
app.use("/account", limiterForApp, accountRoutes);
app.use("/", limiterForApp , orderRoutes);



app.get('/logout', (req, res) => {
    if (req.isAuthenticated()) {
        req.logout((err) => {
            if (!err) {
                res.redirect('/');
            } else {
                console.log(err);
                res.render('server-error')
            }
        });
    } else {
        res.redirect('/');
    }
});

//payments webhook
app.post('/webhook' , express.raw({ type: 'application/json' }) ,webHookController);


  
  
app.get('/test' , async (req,res ) => {
})




app.get("/add-product", (req, res) => {
    res.render('add-product');
});


app.post("/add-product", (req, res) => {
    const data = req.body;
    const product = new Product({
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        isFPA: data.fpa,
        brand: data.brand,
        model: data.model,
        color: data.color,
        imageUrl: data.imageUrl,
        stockQuantity: data.qty,
        detailedDescription: data.detailedDescription
    });

    product.save((err) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err });
        } else {
            return res.status(200).json("Product saved to DB!")
            // res.send("Product saved to DB!")
        }
    });
});



app.use((req, res, next) => {
    res.status(404).render("404");
});


connectDB().then(() => {
    console.log("QuicKart DB Connected Succesfully");
    app.listen(process.env.PORT || 3000, () => {
        console.log(`QuicKart Server Listening on ${process.env.PORT || 3000}`);
    });
});


