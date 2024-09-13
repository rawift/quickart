import Product from "../models/product.js";
import Cart from "../models/cart.js";
import { calculateCartTotal } from "../utils/cartTotal.js";

export const getCategoryProduct = async (req, res) => {
    if (req.isAuthenticated()) {
        const categoryTerm = req.query.category_name;
        try {
            const foundProducts = await Product.find({ category: categoryTerm });
            const foundCart = await Cart.findOne({ user: req.user._id });
            const total = await calculateCartTotal(foundCart);
            res.render("category-items", { Products: foundProducts, cartValue: total, NoOfitems: foundCart.items.length, category: categoryTerm , user : req.user });

        } catch (error) {
            res.status(500).render('server-error');
            console.log(error);
        }
    } else {
        const categoryTerm = req.query.category_name;
        try {
            const foundProducts = await Product.find({ category: categoryTerm });
            res.render("category-items", { Products: foundProducts, cartValue: 0, NoOfitems: 0, category: categoryTerm , user : null });

        } catch (error) {
            res.status(500).render('server-error');
            console.log(error);
        }
    }
}