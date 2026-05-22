import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "tailoringturba@gmail.com",
    pass: "vslfqbufznwcxepo",
  },
});

async function main() {
  try {
    const info = await transporter.sendMail({
      from: '"Tailoring Turba" <tailoringturba@gmail.com>',
      to: "pratikjadhav8820@gmail.com",
      subject: "Test Email",
      text: "This is a test email.",
    });
    console.log("Email sent successfully! Message ID:", info.messageId);
  } catch (err) {
    console.error("Error sending email:", err);
  }
}

main();
