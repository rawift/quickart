import cron from 'node-cron';
import mongoose from 'mongoose'; // Make sure to import mongoose
import Order from '../models/order.js';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_KEY);

// Define the cron job
cron.schedule('*/30 * * * *', async () => {
    try {
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

        // Find orders older than 6 hours that are not shipped
        const ordersToUpdate = await Order.find({
            orderDate: { $lt: sixHoursAgo },
            status: 'Processing'
        });

        if (ordersToUpdate.length == 0) {
            return;
        }

        // Update the status of the found orders
        for (const order of ordersToUpdate) {
            order.status = 'Shipped';
            await order.save();
        }

        console.log(`Updated ${ordersToUpdate.length} orders to status Shipped status.`);
    } catch (error) {
        console.error('Error updating orders:', error);
    }
});

cron.schedule('0 */12 * * *', async () => {
    try {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days in milliseconds

        // Find orders older than 3 days that are not delivered
        const ordersToUpdate = await Order.find({
            orderDate: { $lt: threeDaysAgo },
            status: 'Shipped'
        });

        if (ordersToUpdate.length === 0) {
            return;
        }

        // Update the status of the found orders to 'Delivered'
        for (const order of ordersToUpdate) {
            order.status = 'Delivered';
            await order.save();
        }

        console.log(`Updated ${ordersToUpdate.length} orders to status Delivered.`);
    } catch (error) {
        console.error('Error updating orders:', error);
    }
});



cron.schedule('*/8 * * * *', async () => {
    try {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

        // Find orders older than 10 mins whose payment is still pending
        const ordersToUpdate = await Order.find({
            orderDate: { $lt: tenMinutesAgo },
            status: 'Pending',
            paymentStatus : 'Unpaid'
        }).exec();

        if (ordersToUpdate.length == 0) {
            return;
        }
        // Update the status of the found orders
        for (const order of ordersToUpdate) {
            const session = await stripe.checkout.sessions.expire(order.stripe_cs_id);
            const deleteOrder = await Order.deleteOne({_id : order._id}).exec();
        }

        console.log(`${ordersToUpdate.length} orders flushed.`);
    } catch (error) {
        console.error('Error updating orders:', error);
    }
});