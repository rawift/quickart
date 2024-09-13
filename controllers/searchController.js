import Product from "../models/product.js";
import Cart from "../models/cart.js";
import { calculateCartTotal } from "../utils/cartTotal.js";


export const getSearch = async (req,res) => {
    if(req.isAuthenticated()){
        try {
            const searchTerm = req.query.term;
            const regex = new RegExp(searchTerm, 'i');
            const result = await Product.find({ name: regex });
            const foundCart = await Cart.findOne({ user: req.user._id });   
            const total = await calculateCartTotal(foundCart);
            res.render("search-result" , {fpa : result, term : searchTerm,cartValue : total , NoOfitems : foundCart.items.length, user : req.user});
        } catch (error) {
            console.error(error);
            res.status(500).render('404');
        }
    } else {
    try {
        const searchTerm = req.query.term;
        const regex = new RegExp(searchTerm, 'i');
        const result = await Product.find({ name: regex });
        res.render("search-result" , {fpa : result, term : searchTerm ,cartValue : 0 , NoOfitems : 0, user : null});
    } catch (error) {
        console.error(error);
        res.status(500).render('404');
    }
    }
    
}