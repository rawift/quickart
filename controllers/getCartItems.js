import Cart from "../models/cart.js";
import { calculateCartTotal } from "../utils/cartTotal.js";

export const getCartItems = async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            let userCart = await Cart.findOne({ user: req.user._id });

            if (!userCart) {
                userCart = new Cart({ user: req.user._id, items: [] });
            }
            const foundCartItems = await Cart.findOne({ user: req.user._id }).populate('items.product');
            const total = await calculateCartTotal(foundCartItems);
            res.render("cart", { cartData: foundCartItems, cartTotal: total, cartValue: total, NoOfitems: foundCartItems.items.length });
        } catch (error) {
            console.error(error);
            res.status(500).render('server-error');
        }
    } else {
        res.redirect('/auth/login');
    }

}