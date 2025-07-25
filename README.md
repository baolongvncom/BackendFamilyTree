# 🚀 NT208 Backend Deployment Guide

This is the backend for the **NT208 Family Tree** project.

## ⚙️ Required Environment Variables

Before running the project, create a `.env` file in the root directory and add the following environment variables:

```env
# Cloudinary configuration
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_SECRET_KEY=your_cloudinary_secret_key

# Frontend URL (for CORS)
FAMILYTREE_URL=http://localhost:3000

# MongoDB connection string
MongoDB_URL=mongodb://localhost:27017/FamilyTree

# Secret key for authentication / JWT
SECRET_KEY=your_secret_key
