import Cart from "../models/cart.js";


export const decreaseQuantity = async (req, res) => {
    if(req.isAuthenticated()){
        const userId = req.user._id;
        const { productID } = req.body;
    
        try {
            const userCart = await Cart.findOne({ user: userId });
    
            if (!userCart) {
                return res.status(404).send('Cart not found');
            }
    
            const cartItem = userCart.items.find(item => item.product.equals(productID));
    
            
            if (cartItem) {
                // Decrease the quantity by 1, but ensure it stays at least 0
                cartItem.quantity = Math.max(cartItem.quantity - 1, 0);
    
                if (cartItem.quantity === 0) {
                    // If quantity becomes 0, remove the item
                    userCart.items = userCart.items.filter(item => !item.product.equals(productID));
                }
            }
    
            await userCart.save();
    
            res.redirect('/cart')
        } catch (error) {
            console.error(error);
            res.status(500).render('server-error');
        }
    } else {
        res.redirect('/auth/login');
    }
    
};
