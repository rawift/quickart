import express from 'express';
import { deleteAddress, getSpecificAddress, listUserAddress, updateAddress } from '../controllers/addressController.js';
import { getUserOrders , getOrderByID } from '../controllers/orderController.js';
import { getProfileDetails } from '../controllers/authController.js';
const router = express.Router();


router.get("/manage-addresses" , listUserAddress);

router.post("/modify-address" , getSpecificAddress);

router.post("/update-address" , updateAddress);

router.post("/delete-address" , deleteAddress);

router.get("/orders" , getUserOrders);

router.get("/order" , getOrderByID );

router.get("/profile",  getProfileDetails);

export default router;