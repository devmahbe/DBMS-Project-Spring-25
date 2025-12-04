# 📧 Email OTP Setup Guide

## ✅ What I Changed

I replaced **EmailJS** (which was causing the 400 error) with **Nodemailer** - a reliable server-side email solution.

### Changes Made:
1. ✅ Added Nodemailer to `package.json`
2. ✅ Created server-side endpoints: `/send-otp` and `/verify-otp`
3. ✅ Updated `signup.js` to use server API instead of EmailJS
4. ✅ Removed EmailJS script from `login.html`
5. ✅ Added email configuration to `.env` file

---

## 🔧 Setup Instructions

### Step 1: Install Nodemailer
```bash
npm install nodemailer
```

### Step 2: Get Gmail App Password

#### Option A: Using Gmail (Recommended)

1. **Enable 2-Factor Authentication on your Gmail account:**
   - Go to: https://myaccount.google.com/security
   - Click "2-Step Verification"
   - Follow the steps to enable it

2. **Generate an App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other" (enter "SecureVoice")
   - Click "Generate"
   - **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)

3. **Update your `.env` file:**
   ```env
   SESSION_SECRET='Ub3r$3cur3R@nd0mStr1ng123!'

   # Email Configuration for OTP (Gmail)
   EMAIL_USER=your-actual-email@gmail.com
   EMAIL_PASS=abcdefghijklmnop
   ```
   ⚠️ **Note:** Remove spaces from the app password!

---

#### Option B: Using Other Email Providers

**For Outlook/Hotmail:**
```javascript
service: 'hotmail'
```

**For Yahoo:**
```javascript
service: 'yahoo'
```

**For Custom SMTP Server:**
```javascript
host: 'smtp.yourdomain.com',
port: 587,
secure: false,
auth: {
    user: 'your-email@yourdomain.com',
    pass: 'your-password'
}
```

---

### Step 3: Update Your .env File

Edit: `Actual Project/secret.env`

```env
SESSION_SECRET='Ub3r$3cur3R@nd0mStr1ng123!'

# Replace with your actual Gmail and App Password
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your-16-char-app-password
```

---

### Step 4: Restart Your Server
```bash
npm run server
```

---

## 🎯 How It Works Now

### Old Flow (EmailJS - Had Issues):
```
Frontend → EmailJS API → User's Email
```
**Problems:**
- Rate limits
- API key issues
- 400 errors
- Unreliable

### New Flow (Nodemailer - Reliable):
```
Frontend → Your Server → Nodemailer → Gmail SMTP → User's Email
```
**Benefits:**
- ✅ No rate limits (Gmail allows 500 emails/day for free)
- ✅ More reliable
- ✅ No external API dependencies
- ✅ Better error handling
- ✅ OTP expires in 5 minutes automatically

---

## 📝 API Endpoints Created

### 1. Send OTP
```javascript
POST /send-otp
Body: { "email": "user@example.com" }
Response: { "success": true, "message": "OTP sent successfully" }
```

### 2. Verify OTP
```javascript
POST /verify-otp
Body: { "email": "user@example.com", "otp": "123456" }
Response: { "success": true, "message": "OTP verified successfully" }
```

---

## 🐛 Troubleshooting

### Error: "Invalid login"
**Solution:** Make sure you:
1. Enabled 2-Factor Authentication on Gmail
2. Generated an App Password (not your regular Gmail password)
3. Removed all spaces from the app password in `.env`

### Error: "Failed to send OTP"
**Solution:**
1. Check your `.env` file has correct credentials
2. Make sure `dotenv` is loaded: `require('dotenv').config()`
3. Check your internet connection
4. Try using a different email service

### OTP Not Received
**Check:**
1. Spam/Junk folder
2. Email address is correct
3. Server console for errors
4. Gmail account is active

---

## 🔒 Security Features

1. **OTP Expiration:** OTPs expire after 5 minutes
2. **One-time Use:** OTPs are deleted after verification
3. **Server-side Storage:** OTPs stored in memory (use Redis for production)
4. **Environment Variables:** Email credentials stored securely in `.env`

---

## 🚀 Testing

1. Start server: `npm run server`
2. Go to: `http://localhost:3000/signup`
3. Fill in the signup form
4. Click "Sign Up"
5. Check your email for the OTP
6. Enter the OTP and verify

---

## 📊 Gmail Limits

- **Free Gmail Account:**
  - 500 emails per day
  - 100 emails per hour
  - Perfect for development and small projects

- **Gmail Workspace (Paid):**
  - 2,000 emails per day
  - Better for production

---

## 💡 Alternative: Testing Without Email

For quick testing, you can temporarily disable OTP:

1. Comment out OTP verification in `insertJS.js`
2. Or use a fake SMTP server like **Ethereal Email**: https://ethereal.email/

**Ethereal Setup (Free Testing Email):**
```javascript
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'your-ethereal-user@ethereal.email',
        pass: 'your-ethereal-password'
    }
});
```

---

## ✅ Summary

**Before:** EmailJS (unreliable, 400 errors)  
**After:** Nodemailer + Gmail (reliable, free, secure)

**What you need:**
1. Gmail account with 2FA enabled
2. Gmail App Password
3. Update `.env` file
4. Run `npm install nodemailer`
5. Restart server

**That's it!** 🎉
