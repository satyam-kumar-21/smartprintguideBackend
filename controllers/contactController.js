const asyncHandler = require('express-async-handler');
const nodemailer = require('nodemailer');

// Singleton transporter to prevent "Too many concurrent connections" error
let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            pool: true, // Use connection pooling
            maxConnections: 1, // Limit to 1 connection to respecting server limits
            maxMessages: 5, // Recycle connection after 5 messages
            rateDelta: 1000, // Limit sending rate if needed
            rateLimit: 1,
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }
    return transporter;
};

// @desc    Send contact email
// @route   POST /api/contact
// @access  Public
const sendContactEmail = asyncHandler(async (req, res) => {
    const { type } = req.body;

    let mailOptions;
    
    // Get the shared transporter instance
    const emailTransporter = getTransporter();

    // Verify connection only if needed (optional, doing it every time slows things down)
    // We'll rely on sendMail throwing an error if it fails

    if (type === 'return-exchange') {
        const { 
            fullName, 
            email, 
            phone, 
            orderNumber, 
            orderDate, 
            deliveryDate, 
            productName, 
            reason, 
            itemCondition, 
            resolution, 
            additionalDetails 
        } = req.body;

        if (!fullName || !email || !orderNumber) {
            res.status(400);
            throw new Error('Please fill in all required fields');
        }

        mailOptions = {
            from: `"${fullName}" <${process.env.EMAIL_FROM}>`,
            to: process.env.CONTACT_RECEIVER_EMAIL,
            replyTo: email,
            subject: `Return/Exchange Request: Order #${orderNumber} from ${fullName}`,
            text: `
Return/Exchange Request

Customer Information:
Name: ${fullName}
Email: ${email}
Phone: ${phone || 'N/A'}

Order Information:
Order Number: ${orderNumber}
Order Date: ${orderDate}
Delivery Date: ${deliveryDate}

Product Details:
Product Name: ${productName || 'N/A'}
Reason: ${reason || 'N/A'}
Item Condition: ${itemCondition || 'N/A'}

Resolution Requested: ${resolution || 'N/A'}

Additional Details:
${additionalDetails || 'N/A'}
            `,
            html: `
<h3>New Return/Exchange Request</h3>

<h4>Customer Information</h4>
<p><strong>Name:</strong> ${fullName}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Phone:</strong> ${phone || 'N/A'}</p>

<h4>Order Information</h4>
<p><strong>Order Number:</strong> ${orderNumber}</p>
<p><strong>Order Date:</strong> ${orderDate}</p>
<p><strong>Delivery Date:</strong> ${deliveryDate}</p>

<h4>Product Details</h4>
<p><strong>Product Name:</strong> ${productName || 'N/A'}</p>
<p><strong>Reason:</strong> ${reason || 'N/A'}</p>
<p><strong>Item Condition:</strong> ${itemCondition || 'N/A'}</p>

<h4>Resolution Requested</h4>
<p><strong>${resolution || 'N/A'}</strong></p>

<h4>Additional Details</h4>
<p>${(additionalDetails || 'N/A').replace(/\n/g, '<br>')}</p>
            `
        };

    } else {
        // Default Contact Form
        const { name, email, orderNumber, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            res.status(400);
            throw new Error('Please fill in all required fields');
        }

        mailOptions = {
            from: `"${name}" <${process.env.EMAIL_FROM}>`,
            to: process.env.CONTACT_RECEIVER_EMAIL,
            replyTo: email,
            subject: `Contact Form: ${subject} from ${name}`,
            text: `
Name: ${name}
Email: ${email}
Order Number: ${orderNumber || 'N/A'}
Subject: ${subject}

Message:
${message}
            `,
            html: `
<h3>New Contact Form Submission</h3>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Order Number:</strong> ${orderNumber || 'N/A'}</p>
<p><strong>Subject:</strong> ${subject}</p>
<p><strong>Message:</strong></p>
<p>${message.replace(/\n/g, '<br>')}</p>
            `,
        };
    }

    // Send email
    try {
        await emailTransporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('Email sending error:', error);
        res.status(500);
        throw new Error('Failed to send email. Please try again later.');
    }
});

module.exports = { sendContactEmail };
