import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    partNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      default: "",
      trim: true,
    },

    unit: {
      type: String,
      default: "Piece",
      trim: true,
    },

    sizes: {
      type: [String],
      default: [],
    },

    colours: {
      type: [String],
      default: [],
    },

    price: {
      type: Number,
      default: 0,
      min: 0,
    },

    singlePiecePrice: {
      type: Number,
      default: null,
      min: 0,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Product", productSchema);