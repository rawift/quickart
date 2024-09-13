import Cart from "../models/cart.js";

export const increaseQuantity = async (req, res) => {
    const userId = req.user._id; // Replace with the actual user ID from your authentication system
    const { productID } = req.body;

    try {
        const userCart = await Cart.findOne({ user: userId });

        if (!userCart) {
            return res.status(404).send('Cart not found');
        }

        const cartItem = userCart.items.find(item => item.product.equals(productID));

        if (cartItem) {
            // Increase the quantity by 1
            cartItem.quantity += 1;
        } else {
            // do nothing
        }

        await userCart.save();

        res.redirect('/cart');
    } catch (error) {
        console.error(error);
        res.status(500).render('server-error');
    }
};
