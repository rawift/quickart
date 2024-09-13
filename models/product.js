import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      maxlength: 50,
    },
    description: {
      type: String,
      required: true,
      maxlength: 75,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      max : 1000000,
    },
    category: {
      type: String,
      enum : ['Mobiles' , 'Electronics' , 'Fashion' , 'Furniture' , 'Groceries'],
      required: true,
    },
    brand: {
        type : String,
        required : true
    },
    model : {
        type : String,
        required : true
    },
    color: {
        type : String,
        required : true
    },
    imageUrl: {
        type : String,
        required : true
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    isFPA : {type : Boolean , default : false},
    detailedDescription : {
        type : String,
        required : true
    },
    utf1 : {
        type : String,
        required : true,
        default : 'NA'
    },
    utf2 : {
        type : String,
        required : true,
        default : 'NA'
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  });
  
const Product = mongoose.model('Product', productSchema);

export default Product;