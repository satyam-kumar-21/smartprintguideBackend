// In-memory OTP storage (use Redis in production)
const otpStorage = new Map();

// Store OTP with expiration (10 minutes)
const storeOTP = (email, otp) => {
    const expirationTime = Date.now() + (10 * 60 * 1000); // 10 minutes
    otpStorage.set(email, {
        otp,
        expiresAt: expirationTime
    });
};

// Verify OTP
const verifyOTP = (email, otp) => {
    const storedData = otpStorage.get(email);

    if (!storedData) {
        return false;
    }

    // Check if expired
    if (Date.now() > storedData.expiresAt) {
        otpStorage.delete(email);
        return false;
    }

    // Check if OTP matches
    if (storedData.otp === otp) {
        otpStorage.delete(email); // Remove after successful verification
        return true;
    }

    return false;
};

// Clean up expired OTPs (run periodically)
const cleanupExpiredOTPs = () => {
    const now = Date.now();
    for (const [email, data] of otpStorage.entries()) {
        if (now > data.expiresAt) {
            otpStorage.delete(email);
        }
    }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);

module.exports = {
    storeOTP,
    verifyOTP
};