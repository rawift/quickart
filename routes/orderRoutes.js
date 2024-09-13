import express from 'express';
import { createOrder, handleSuccessCallback, showPaymentMethodPage , getOrderCancellationDetails , processOrderCancellation, refundStatus } from '../controllers/orderController.js';
import { webHookController } from '../controllers/webhookController.js';
const router = express.Router();

router.post('/payment-method' , showPaymentMethodPage);

router.post('/create-checkout-session' , createOrder);

router.get('/paymentResponse' , handleSuccessCallback);

router.get('/paymentFailed' , (req,res) => {
    res.render('order-fail');
});

router.get('/order-cancellation' , getOrderCancellationDetails);

router.post('/process-order-cancellation' , processOrderCancellation);


router.get('/track-refund-status' , refundStatus);



export default router;