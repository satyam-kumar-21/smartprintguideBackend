const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

const seedUsers = async () => {
    try {
        await connectDB();

        // 1. Admin User
        const adminEmail = 'satyam@gmail.com';
        const adminPass = '12345678';
        
        let adminUser = await User.findOne({ email: adminEmail });
        
        if (adminUser) {
            // ...existing code...
            adminUser.password = adminPass; // schema pre-save will hash this
            adminUser.isAdmin = true;
            await adminUser.save();
            // ...existing code...
        } else {
            // ...existing code...
            await User.create({
                firstName: 'Satyam',
                lastName: 'Admin',
                name: 'Satyam Admin',
                email: adminEmail,
                password: adminPass,
                isAdmin: true
            });
            // ...existing code...
        }

        // 2. Regular User
        const userEmail = 'satyamuser@gmail.com';
        const userPass = '12345678';

        let normalUser = await User.findOne({ email: userEmail });
        
        if (normalUser) {
            // ...existing code...
            normalUser.password = userPass;
            normalUser.isAdmin = false;
            await normalUser.save();
            // ...existing code...
        } else {
            // ...existing code...
            await User.create({
                firstName: 'Satyam',
                lastName: 'User',
                name: 'Satyam User',
                email: userEmail,
                password: userPass,
                isAdmin: false
            });
            // ...existing code...
        }

        // ...existing code...
        process.exit();
    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
};

seedUsers();
