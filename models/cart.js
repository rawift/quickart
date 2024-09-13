import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true , min : 0 },
});

const cartSchema = new mongoose.Schema({
    user : { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true  , unique : true},
    items: [cartItemSchema],
    created_at: { type: Date, default: Date.now },
    addressID : {
        type : String,
        default : 'NA',
    }
});


cartSchema.pre('findOne', function (next) {
    this.populate('items.product');
    next();
});

cartSchema.pre('findOneAndUpdate', function (next) {
    this.populate('items.product');
    next();
});
  

cartSchema.methods.calculateTotal = function () {
    // Calculate the total cart value based on the items in the cart
    this.total = this.items.reduce((total, item) => {
        const product = item.product;  // Access the populated product details

        if (product) {
            const productPrice = product.price || 0;

            return total + item.quantity * productPrice;
        } else {
            console.error(`Product not found for item with ID ${item._id}.`);
            return total;
        }
    }, 0);
};



// Populate product details before retrieving the cart data
cartSchema.pre('findOne', function (next) {
    this.populate('items.product');
    next();
});


const Cart = mongoose.model('Cart', cartSchema);


export default Cart;