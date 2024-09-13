import User from "../models/user.js";
import Cart from "../models/cart.js";
import { calculateCartTotal } from "../utils/cartTotal.js";

export const getUserAddress = async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const foundCart = await Cart.findOne({ user: req.user._id });
            const total = await calculateCartTotal(foundCart);
            res.render('select-address', { address: req.user.address, cartValue: total, NoOfitems: foundCart.items.length })
        } catch (error) {
            console.log(error);
            res.status(500).render('server-error');
        }
       
    } else {
        res.redirect('/auth/login');
    }
}

export const addNewAddress = async (req, res) => {
    if (req.isAuthenticated()) {
        const newAddress = {
            name: req.body.name,
            streetAddress: req.body.streetAddress,
            city: req.body.city,
            zip: req.body.zip,
            phone: req.body.phone
        }
        try {
            const updatedUser = await User.findByIdAndUpdate(
                req.user._id,
                { $push: { address: newAddress } },
                { new: true }
            );
            if (req.query.r_url === 'profileAddress') {
                res.redirect('/account/manage-addresses');
            } else {
                res.redirect('/select-address');
            }
        } catch (error) {
            res.status(500).render('server-error');
            console.error('Error adding address:', error.message);
        }
    } else {
        res.redirect('/auth/login');
    }
}

export const listUserAddress = async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const foundCart = await Cart.findOne({ user: req.user._id });
            const total = await calculateCartTotal(foundCart);
            res.render('manage-address', { address: req.user.address, cartValue: total, NoOfitems: foundCart.items.length });
        } catch (error) {
            console.log(error);
            res.status(500).render('server-error');
        }
    } else {
        res.redirect('/auth/login');
    }
}

export const getSpecificAddress = async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const desiredAddressId = req.body.addressID;
            const desiredAddress = req.user.address.find(address => address._id.toString() === desiredAddressId);
            const foundCart = await Cart.findOne({ user: req.user._id });
            const total = await calculateCartTotal(foundCart);
            res.render('modify-address', { address: desiredAddress, cartValue: total, NoOfitems: foundCart.items.length });
        } catch (error) {
            console.log(error);
            res.status(500).render('server-error');

        }
    } else {
        res.redirect('/auth/login');
    }
}

export const updateAddress = async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            const userId = req.user._id; // Replace with the actual user ID
            const addressIdToUpdate = req.body.addressID; // Replace with the actual address ID
            // Define the updated address fields
            const updatedAddress = {
                name: req.body.name,
                streetAddress: req.body.streetAddress,
                city: req.body.city,
                zip: req.body.zip,
                phone: req.body.phone,
            };

            // Update the address if the user and address exist
            User.findOneAndUpdate(
                { _id: userId, 'address._id': addressIdToUpdate },
                { $set: { 'address.$': updatedAddress } },
                { new: true } // Return the updated document
            )
                .then(updatedUser => {
                    if (updatedUser) {
                        res.redirect('/account/manage-addresses');
                    } else {
                        console.log('Address not found for the user');
                    }
                })
                .catch(error => {
                    console.error('Error updating address:', error);
                });
        } catch (error) {
            console.log(error);
            res.status(500).render('server-error');
        }
    } else {
        res.redirect('/auth/login');
    }
}

export const deleteAddress = async (req,res) => {
    if(req.isAuthenticated()){
        try {
            const task = await User.findOneAndUpdate(
                { _id: req.user._id },
                { $pull: { address: { _id: req.body.addressID } } },
                { new: true }
              );
            res.redirect('/account/manage-addresses');
        } catch (error) {
            console.log(error);
            res.status(500).render('server-error');
        }
    } else {
        res.redirect('/auth/login');
    }
}