const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        // ...existing code...
        
        const products = await Product.find({ slug: { $exists: false } });
        // ...existing code...
        
        for (const product of products) {
            product.slug = product.title.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, "-");
            await product.save();
            // ...existing code...
        }
        
        // ...existing code...
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

connectDB();
