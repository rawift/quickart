import express from 'express';
const router = express.Router();
import { checkVerified } from '../middlewares/verifiedProfileMiddleware.js';
import { getCartItems } from '../controllers/getCartItems.js';
import { addToCart } from '../controllers/addToCart.js';
import { removeFromCart } from '../controllers/removeFromCart.js';
import { increaseQuantity } from '../controllers/increaseQuantity.js';
import { decreaseQuantity } from '../controllers/decreaseQuantity.js';

router.get("/cart" , checkVerified, getCartItems);


router.post("/add-to-cart" , addToCart);

router.post("/remove-from-cart" , removeFromCart);

router.post("/increase-quantity" , increaseQuantity);

router.post("/decrease-quantity" , decreaseQuantity);


export default router;