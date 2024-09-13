import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
    userId: {
      type: String,
      required: true,
      unique : true,
    },
    tokenType : {
        type : String,
        enum : ['VERIFY_EMAIL' , 'RESET'],
        required : true,
    },
    token: {
      type: String,
      required: true,
      unique : true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 3600 * 24, // 24 hour
    },
  });


const Token = mongoose.model('Token', tokenSchema);

export default Token;