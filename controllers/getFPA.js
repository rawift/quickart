import Product from "../models/product.js";
import Cart from "../models/cart.js";
import { calculateCartTotal } from "../utils/cartTotal.js";

//fpa stands for Front Page Articles

export const getFPA = async (req,res) => {
    if(req.isAuthenticated()){
        try {
            
            let userCart = await Cart.findOne({ user: req.user._id });

            if (!userCart) {
                const newCart = new Cart({ user: req.user._id, items: [] });
                newCart.save();
                const foundFPA = await Product.find({ isFPA: true });
                const foundCart = await Cart.findOne({ user: req.user._id });   
                const total = await calculateCartTotal(foundCart);
                res.render("home" , {fpa : foundFPA , cartValue : total , NoOfitems : foundCart.items.length , user : req.user});
            } else {
                const foundFPA = await Product.find({ isFPA: true });
                const foundCart = await Cart.findOne({ user: req.user._id });   
    
                const total = await calculateCartTotal(foundCart);
                res.render("home" , {fpa : foundFPA , cartValue : total , NoOfitems : foundCart.items.length , user : req.user});

            }
        } catch (error) {
            console.error(error);
            res.status(500).render('server-error');
        }
    } else {
        try {
            const foundFPA = await Product.find({ isFPA: true });
            res.render("home" , {fpa : foundFPA , cartValue : 0 , NoOfitems : 0 , user : null});
        } catch (error) {
            console.error(error);
            res.status(500).render('server-error');
        }
    }
    
}