import Product from "../models/product.js";
import Cart from "../models/cart.js";
import { calculateCartTotal } from "../utils/cartTotal.js";

export const getProduct = async (req,res) => {
    if(req.isAuthenticated()){
        const productID = req.query.product_id;
        try {
            const foundProduct = await Product.findOne({ _id: productID });
            const foundCart = await Cart.findOne({ user: req.user._id });   
            const total = await calculateCartTotal(foundCart);
            if(foundProduct != null){
                res.render("product" , {product : foundProduct, cartValue : total , NoOfitems : foundCart.items.length, user : req.user});
            } else {
                res.render('404');
            }
        } catch (error) {
            console.error(error);
            res.status(500).render('404');
        }
    } else {
        const productID = req.query.product_id;
    try {
        const foundProduct = await Product.findOne({ _id: productID });
        if(foundProduct != null){
            res.render("product" , {product : foundProduct, cartValue : 0 , NoOfitems : 0, user : null});
        } else {
            res.render('404');
        }
    } catch (error) {
        console.error(error);
        res.status(500).render('404');
    }
    }
    
}