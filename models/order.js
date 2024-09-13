import mongoose from "mongoose";


const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderNumber : {
        type : String,
        unique : true,
        required : true
    },
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true
            }
        }
    ],
    orderValue: {
        type: Number,
        required: true
    },
    shippingAddressID: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered' , 'Cancelled'],
        default: 'Pending'
    },
    stripe_cs_id : {
        type: String,
        required: true
    },
    stripe_pi_id : {
        type: String,
        required: true,
        default : 'Pending'
    },
    paymentMethod : {
        type: String,
        required: true,
        default : 'NA'
    },
    paymentStatus : {
        type: String,
        enum: ['Unpaid', 'Paid' , 'Refunded'],
        default : 'Unpaid',
        required: true
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
}
, { timestamps: true }
);

orderSchema.pre('findOne', function (next) {
    this.populate('user')
        .populate({
            path: 'products.product',
            model: 'Product'
        });
    next();
});

orderSchema.pre('find', function (next) {
    this.populate('user')
        .populate({
            path: 'products.product',
            model: 'Product'
        });
    next();
});

orderSchema.pre('findOneAndUpdate', function (next) {
    this.populate('user')
        .populate({
            path: 'products.product',
            model: 'Product'
        });
    next();
});



const Order = mongoose.model('Order', orderSchema);

export default Order;