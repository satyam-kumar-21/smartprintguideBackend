const EasyPostClient = require('@easypost/api');
const asyncHandler = require('express-async-handler');

// @desc    Get shipping rates
// @route   POST /api/shipping/rates
// @access  Private
const getShippingRates = asyncHandler(async (req, res) => {
    const { address, city, postalCode, country, state, phone, cartItems } = req.body;

    if (!process.env.EASYPOST_API_KEY) {
        res.status(500);
        throw new Error('EasyPost API Key not configured');
    }

    const client = new EasyPostClient(process.env.EASYPOST_API_KEY);

    try {
        // 1. Create To Address
        const toAddress = await client.Address.create({
            street1: address,
            city: city,
            state: state, 
            zip: postalCode,
            country: country || 'US',
            phone: phone || '555-555-5555',
            email: req.user ? req.user.email : undefined,
        });

        // 2. Create From Address (Company Location)
        // Using environment variables for company location, with defaults
        const fromAddress = await client.Address.create({
            company: 'Smart Eprinting',
            street1: process.env.COMPANY_ADDRESS || '123 Market St',
            city: process.env.COMPANY_CITY || 'San Francisco',
            state: process.env.COMPANY_STATE || 'CA',
            zip: process.env.COMPANY_ZIP || '94105',
            country: process.env.COMPANY_COUNTRY || 'US',
            phone: process.env.COMPANY_PHONE || '415-555-5555',
        });

        // 3. Create Parcel
        // Calculate total weight. EasyPost uses ounces.
        // Assuming ~16oz (1lb) per item quantity if no weight is specified in product.
        const totalWeight = cartItems && cartItems.length > 0 
            ? cartItems.reduce((acc, item) => acc + (16 * item.qty), 0)
            : 16;

        const parcel = await client.Parcel.create({
            weight: totalWeight,
            // Generic dimensions if unknown
            length: 10,
            width: 8,
            height: 4
        });

        // 4. Create Shipment
        const shipment = await client.Shipment.create({
            to_address: toAddress,
            from_address: fromAddress,
            parcel: parcel,
        });

        res.json(shipment.rates);

    } catch (error) {
        console.error('EasyPost Error:', error);
        res.status(400);
        throw new Error('Could not calculate shipping rates: ' + error.message);
    }
});

module.exports = { getShippingRates };
