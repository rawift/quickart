import Cart from "../models/cart.js";
import mongoose from 'mongoose';

export const removeFromCart = async (req,res) => {
    const userId = req.user._id;
    const productID = req.body.productID; 
    
    try {
      const result = await Cart.updateOne(
        { user: userId },
        { $pull: { items: { product: mongoose.Types.ObjectId(productID) } } }
      );
          res.redirect(`/cart?productid=${productID}&removedfromcart=true`);
      // Handle the success, result will contain information about the update
    } catch (error) {
      res.status(500).render('server-error');
      console.error(error);
      // Handle the error
    }
    
}