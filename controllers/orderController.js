import User from "../models/user.js";
import Cart from "../models/cart.js";
import { calculateCartTotal } from "../utils/cartTotal.js";
import { generateOrderNumber } from "../utils/generateOrderNo.js"
import Order from "../models/order.js";
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_KEY);
import sendMail from "../utils/postMaster.js";

export const showPaymentMethodPage = async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const updateCart = await Cart.findOneAndUpdate({ user: req.user._id }, { addressID: req.body.addressID }).populate('items.product');
            const address = req.user.address.find(addr => addr._id.toString() === req.body.addressID);

            const total = await calculateCartTotal(updateCart);
            res.render('payment-method', { total: total, cart: updateCart, address: address });
        } catch (error) {
            res.status(500).render('server-error');
            console.log(error);
        }
    } else {
        res.redirect('/auth/login');
    }
}



export const createOrder = async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            if (req.body.payment === 'cod') {
                res.render('cod-verify');
            } else {
                const cart = await Cart.findOne({ user: req.user._id })
                const total = await calculateCartTotal(cart);
                const orderNo = generateOrderNumber();
                const cartAmount = total <= 49 ? (total + 9) : total;

                // Check if the user has a Stripe customer ID
                let stripeCustomerId = req.user.stripeCustomerId;

                if (!stripeCustomerId) {
                    // Create a new Stripe customer if the user doesn't have one
                    const createCustomer = await stripe.customers.create({
                        name: req.user.name,
                        email: req.user.email,
                    });

                    // Update the user with the new Stripe customer ID
                    const updatedUser = await User.findByIdAndUpdate(
                        req.user._id,
                        { stripeCustomerId: createCustomer.id },
                        { new: true }
                    ).exec();

                    // Use the updated user's Stripe customer ID
                    stripeCustomerId = updatedUser.stripeCustomerId;
                }


                // Create the Stripe Checkout session
                const session = await stripe.checkout.sessions.create({
                    customer: stripeCustomerId,
                    client_reference_id: orderNo,
                    line_items: [
                        {
                            price_data: {
                                currency: 'usd',
                                product_data: {
                                    name: `Payment for Order ID - ${orderNo}`,
                                },
                                unit_amount: cartAmount * 100,
                            },
                            quantity: 1,
                        },
                    ],
                    mode: 'payment',
                    allow_promotion_codes: true,
                    success_url: `${process.env.DOMAIN}/paymentResponse?rto_no=${orderNo}&cs_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${process.env.DOMAIN}/paymentFailed`,
                });



                const orderData = {
                    user: req.user._id,
                    orderNumber: orderNo,
                    orderValue: cartAmount,
                    stripe_cs_id: session.id,
                };

                // Find the user's cart and create an order
                Cart.findOne({ user: req.user._id }).populate('items.product')
                    .then((cart) => {
                        if (!cart) {
                            res.status(500).render('server-error');
                            throw new Error('Cart not found for the user');
                        }

                        // Populate the order's products array based on the user's cart
                        orderData.products = cart.items.map((cartItem) => ({
                            product: cartItem.product._id,
                            quantity: cartItem.quantity,
                        }));

                        orderData.shippingAddressID = cart.addressID;


                        // Create a new order
                        const newOrder = new Order(orderData);

                        // Save the order to the database
                        return newOrder.save();
                    })
                    .then((savedOrder) => {
                        res.redirect(303, session.url)
                    })
                    .catch((error) => {
                        res.status(500).render('server-error');
                        console.error('Error creating order:', error.message);
                    });

            }
        } catch (error) {
            res.status(500).render('server-error');
            console.log(error);
        }
    } else {
        res.redirect('/auth/login');
    }
}

export const handleSuccessCallback = async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/auth/login');
    }

    const { rto_no, cs_id } = req.query;

    if (!rto_no || !cs_id) {
        return res.status(400).render("404");
    }

    try {
        const fetchOrder = await Order.findOne({ orderNumber: rto_no, stripe_cs_id: cs_id }).exec();

        if (!fetchOrder) {
            return res.status(404).render("404");
        }

        const address = req.user.address.find(addr => addr._id.toString() === fetchOrder.shippingAddressID);

        if (fetchOrder.status === 'Processing') {
            return res.render('order-success', { fullOrder: fetchOrder, address: req.user.address.find(addr => addr._id.toString() === fetchOrder.shippingAddressID) });
        }

        const session = await stripe.checkout.sessions.retrieve(cs_id);

        if (session.payment_status === 'paid') {
            const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
            const paymentMethodId = paymentIntent.payment_method;
            const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

            // Empty the cart
            await Cart.updateOne({ user: fetchOrder.user }, { $set: { items: [] } }).exec();

            // Update the order
            const updateOrder = await Order.findOneAndUpdate(
                { _id: fetchOrder._id },
                {
                    $set: {
                        status: "Processing",
                        stripe_pi_id: session.payment_intent,
                        paymentStatus: "Paid",
                        paymentMethod: paymentMethod.type,
                    },
                },
                { new: true }
            ).populate('items.product').exec();
            
            // send email
            const event = new Date();
            const timestamp = event.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' });
            await sendMail(updateOrder.user.email, 'Order Confirmation', 'templates/mailer/order-confirmation-template.ejs', { orderData: updateOrder, timestamp: timestamp, address: address, domain: process.env.DOMAIN });

            return res.render('order-success', { fullOrder: updateOrder, address: address });
        } else {
            return res.render("order-fail");
        }

    } catch (error) {
        console.error('Error handling payment success callback:', error);
        return res.render('server-error');
    }
}

export const getUserOrders = async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const foundOrders = await Order.find({ user: req.user._id }).populate('items.product').sort({ orderDate: -1 });
            res.render("orders", { orders: foundOrders });
        } catch (error) {
            console.log(error);
        }
    } else {
        res.redirect("/auth/login")
    }
}

export const getOrderByID = async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const foundOrder = await Order.findOne({ orderNumber: req.query.order_no, user: req.user._id }).populate('items.product');
            if (foundOrder != null) {
                const address = await req.user.address.find(addr => addr._id.toString() === foundOrder.shippingAddressID);
                res.render("order-details", { fullOrder: foundOrder, address: address });
            } else {
                res.render('404');
            }
        } catch (error) {
            console.log(error);
        }
    } else {
        res.redirect('/auth/login');
    }
}

export const getOrderCancellationDetails = async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const foundOrder = await Order.findOne({ orderNumber: req.query.order_no, user: req.user._id }).populate('items.product');
            if (foundOrder != null) {
                res.render("order-cancellation", { order: foundOrder });
            } else {
                res.render('404');
            }
        } catch (error) {
            console.log(error);
        }
    } else {
        res.redirect('/auth/login');
    }
}

export const processOrderCancellation = async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const foundOrder = await Order.findOne({ orderNumber: req.body.order_no, user: req.user._id }).populate('items.product');
            if (foundOrder != null) {
                if (foundOrder.status === 'Shipped' || foundOrder.status === 'Processing') {
                    // Creating refund from stripe api
                    const refund = await stripe.refunds.create({
                        payment_intent: foundOrder.stripe_pi_id
                    });


                    // update order on db
                    const updateOrder = await Order.findOneAndUpdate({ orderNumber: foundOrder.orderNumber }, { status: 'Cancelled', paymentStatus: 'Refunded', stripe_pi_id: refund.id });

                    res.render("order-cancelled", { order: foundOrder });
                } else {
                    res.render('404');
                }
            } else {
                res.render('404');
            }
        }
        catch (error) {
            res.render("server-error");
            console.log(error);
        }
    } else {
        res.redirect('/auth/login');
    }
}

export const refundStatus = async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const foundOrder = await Order.findOne({ orderNumber: req.query.order_no });
            const refundDetails = await stripe.refunds.retrieve(foundOrder.stripe_pi_id);
            res.render('refund-status', { order: foundOrder, refund: refundDetails });
        } catch (error) {
            res.render('server-error');
            console.log(error);
        }
    } else {
        res.redirect('/auth/login');
    }
}