import Cart from "../models/cart.js";
import Product from "../models/product.js";

export const addToCart = async (req, res) => {
    const { productID } = req.body;

    if(req.isAuthenticated()){
        const userId = req.user._id; // Replace with the actual user ID from your authentication system
    const quantity = 1;

    try {
        // You might want to check if the product ID is valid here
        const product = await Product.findById(productID);

        if (!product) {
            return res.status(404).send('Product not found');
        }

        let userCart = await Cart.findOne({ user: userId });

        if (!userCart) {
            userCart = new Cart({ user: userId, items: [] });
        }

        const existingCartItem = userCart.items.find(item => item.product.equals(productID));

        if (existingCartItem) {
            // If the product exists, update the quantity
            existingCartItem.quantity = existingCartItem.quantity + 1;
        } else {
            // If the product doesn't exist in cart, you might choose to handle it as an error
            userCart.items.push({ product: productID, quantity });
        }

        await userCart.save();

        res.redirect(`/product?product_id=${productID}&addedtocart=true`)
    } catch (error) {
        console.error(error);
        res.status(500).render('server-error');
    }
    } else {
        res.redirect(`/auth/login?redirect_uri=/product?product_id=${productID}`);
    }
    
};