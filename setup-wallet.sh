#!/bin/bash

# BSC Wallet Integration - Quick Setup Script

echo "🚀 Setting up BSC Wallet Integration..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from example..."
    cp .env.example .env
    echo "✅ Created .env file"
fi

# Generate encryption key if not set
if ! grep -q "WALLET_ENCRYPTION_KEY=.\{64\}" .env; then
    echo "🔐 Generating wallet encryption key..."
    ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    # Update .env file
    if grep -q "WALLET_ENCRYPTION_KEY=" .env; then
        sed -i "s/WALLET_ENCRYPTION_KEY=.*/WALLET_ENCRYPTION_KEY=$ENCRYPTION_KEY/" .env
    else
        echo "WALLET_ENCRYPTION_KEY=$ENCRYPTION_KEY" >> .env
    fi
    echo "✅ Generated and saved encryption key"
fi

# Check contract address
if ! grep -q "ESCROW_CONTRACT_ADDRESS=0x" .env; then
    echo "⚠️  ESCROW_CONTRACT_ADDRESS not set in .env"
    echo "Please deploy your contract and add the address to .env"
fi

# Check network setting
if ! grep -q "BSC_NETWORK=" .env; then
    echo "BSC_NETWORK=testnet" >> .env
    echo "✅ Set network to testnet"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Deploy GonanaEscrow contract to BSC testnet"
echo "2. Add contract address to .env: ESCROW_CONTRACT_ADDRESS=0x..."
echo "3. Run: yarn start:dev"
echo "4. Access Swagger docs: http://localhost:3000/api/docs"
echo ""
echo "⚠️  IMPORTANT: In production, store WALLET_ENCRYPTION_KEY securely!"
