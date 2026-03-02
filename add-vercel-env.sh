#!/bin/bash
# Script to add environment variables to Vercel

echo "Adding environment variables to Vercel..."

# Install Vercel CLI if not installed
# npm i -g vercel

# Login to Vercel (if not already logged in)
# vercel login

# Add environment variables
echo "Adding VITE_API_URL..."
echo "https://lionfish-app-irgo6.ondigitalocean.app/api" | vercel env add VITE_API_URL production

echo "Adding VITE_INFURA_API_KEY..."
echo "3e7de97412bd4e9d8adc98a6ed2e9a21" | vercel env add VITE_INFURA_API_KEY production

echo "Adding VITE_ENVIRONMENT..."
echo "production" | vercel env add VITE_ENVIRONMENT production

echo "Adding VITE_WALLETCONNECT_PROJECT_ID..."
echo "d77f88a21bd9ea69547c2b23b71953ef" | vercel env add VITE_WALLETCONNECT_PROJECT_ID production

echo "Environment variables added successfully!"
echo "Now redeploy your application with: vercel --prod"