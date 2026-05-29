import nodemailer from "nodemailer";

async function testMail() {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: "shamal.geethanjanpathirana@gmail.com",
            pass: "wedk rhuf bsuu zfra", // replace with your App Password
        },
    });

    try {
        await transporter.sendMail({
            from: `"Food Lab System" <shamal.geethanjanpathirana@gmail.com>"`,
            to: "shamal.geethanjanpathirana@gmail.com",
            subject: "Test OTP Email",
            text: "Hello bro! This is a test email from your Node.js script",
        });
        console.log("Test email sent!");
    } catch (err) {
        console.error("Email error:", err);
    }
}

testMail();
