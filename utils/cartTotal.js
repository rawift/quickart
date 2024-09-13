export const calculateCartTotal = async (cart) => {
    // Ensure that cart items are populated with product details
    await cart.populate('items.product').execPopulate();

    // Calculate the total cart value based on the items in the cart
    const total = cart.items.reduce((total, item) => {
        const product = item.product;

        if (product) {
            const productPrice = product.price || 0;
            return total + item.quantity * productPrice;
        } else {
            console.error(`Product not found for item with ID ${item._id}.`);
            return total;
        }
    }, 0);

    return total;
};