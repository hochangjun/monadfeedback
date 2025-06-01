# Vercel Deployment Setup

## 🚀 Deploy to Vercel with Persistent Storage

### 1. **Push to GitHub**
```bash
git add .
git commit -m "Add Vercel KV persistent storage"
git push origin main
```

### 2. **Connect to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Deploy (first deployment will work but data won't persist yet)

### 3. **Add Neon PostgreSQL Database**
1. In your Vercel dashboard, go to your project
2. Click **Storage** tab
3. Scroll down to **Marketplace Database Providers**
4. Click **Neon** (Serverless Postgres)
5. Follow the Neon integration steps
6. Create database with name like `monad-feedback-db`
7. Vercel will automatically connect the database to your project

### 4. **Environment Variables (Auto-Added)**
Vercel automatically adds these when you integrate Neon:
- `DATABASE_URL` (PostgreSQL connection string)
- Other Neon-specific variables

### 5. **Redeploy**
After adding KV, trigger a new deployment:
- Push any small change to GitHub, OR
- Go to Vercel dashboard → Deployments → Redeploy

## ✅ What This Fixes

**Before (File Storage):**
- ❌ Data lost on each deployment
- ❌ Only works locally
- ❌ No cross-device sharing

**After (Neon PostgreSQL):**
- ✅ Data persists across deployments
- ✅ Works on Vercel production
- ✅ True cross-device sharing
- ✅ Full SQL database with proper tables and indexes

## 🔄 Migration Process

The system automatically migrates:
1. **localStorage data** → **Neon PostgreSQL**
2. **Old file storage** → **Neon PostgreSQL** (if any exists)
3. **No data loss** during transition
4. **Database tables auto-created** on first use

## 💾 Storage Limits

**Neon PostgreSQL Free Tier:**
- 512MB storage
- 1M row inserts/month
- 100 hours compute/month
- Perfect for feedback system - way more generous!

## 🧪 Testing

After deployment:
1. Submit feedback from Device A
2. Check admin panel from Device B
3. Should see all feedback from all devices! 

---

**Your feedback platform will now persist data across all deployments and devices! 🎉** 