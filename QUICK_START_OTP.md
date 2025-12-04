# 🚀 Quick Start - OTP Email Setup

## 1️⃣ Install Nodemailer
```bash
npm install nodemailer
```

## 2️⃣ Get Gmail App Password

### Go to: https://myaccount.google.com/apppasswords
1. Enable 2-Factor Authentication first
2. Generate App Password for "Mail"
3. Copy the 16-character password

## 3️⃣ Update .env File

Edit: `Actual Project/secret.env`

```env
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=abcdefghijklmnop
```
⚠️ Remove spaces from app password!

## 4️⃣ Restart Server
```bash
npm run server
```

## ✅ Done! Test it:
- Go to signup page
- Enter your details
- Check email for OTP
- Verify and complete registration

---

## 📧 Email Format
The OTP email will look like this:

**Subject:** SecureVoice - Your OTP Code

**Body:**
```
SecureVoice - Email Verification

Your OTP code is:
  123456

This code will expire in 5 minutes.
```

---

## 🐛 Common Issues

**"Invalid login"**
→ Use App Password, not regular Gmail password

**OTP not received**
→ Check spam folder

**"Failed to send OTP"**
→ Check .env file credentials

---

## 📖 Full Documentation
See `EMAIL_SETUP_GUIDE.md` for detailed instructions
