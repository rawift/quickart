import express from 'express';
const router = express.Router();
import { getFPA } from '../controllers/getFPA.js';
import { getProduct } from '../controllers/getProduct.js';
import { getCategoryProduct } from '../controllers/getCategoryProduct.js';
import { addNewAddress, getUserAddress } from '../controllers/addressController.js';
import { getSearch } from '../controllers/searchController.js';
import { quickartElitePage , quickartEliteBilling, subscriptionPaymentHandler } from '../controllers/quickartEliteMembershipController.js';
import { checkVerified } from '../middlewares/verifiedProfileMiddleware.js';
router.get("/" , getFPA);

router.get("/search" , getSearch);

router.get("/product" , getProduct);

router.get("/categories" , getCategoryProduct);

router.get("/select-address" , checkVerified, getUserAddress);

router.post("/add-address" , checkVerified, addNewAddress);

router.get("/quickart-elite" , checkVerified, quickartElitePage);

router.get("/quickart-elite/billing" , checkVerified, quickartEliteBilling);

router.get("/subscription-payment-handler" , checkVerified, subscriptionPaymentHandler);


export default router;