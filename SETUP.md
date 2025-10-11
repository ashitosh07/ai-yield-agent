# Quick Setup Guide

## 1. Get API Keys (5 minutes)

### Pimlico Bundler (Required)
1. Go to [pimlico.io](https://pimlico.io)
2. Sign up → Get API key
3. Add to `.env`: `BUNDLER_URL=https://api.pimlico.io/v2/monad-testnet/rpc?apikey=YOUR_KEY`

### MetaMask Project ID (Required)
1. Go to [MetaMask Developer Portal](https://developer.metamask.io)
2. Create project → Copy Project ID
3. Add to `.env`: `METAMASK_PROJECT_ID=your_project_id`

### OpenAI API (Optional - for better AI)
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Get API key
3. Add to `.env`: `OPENAI_API_KEY=your_key`

## 2. Setup Environment (2 minutes)

```bash
# Clone and setup
cd ai-yield-agent
cp .env.example .env

# Edit .env with your API keys
notepad .env  # Windows
```

## 3. Run Project (1 minute)

```bash
# Start all services
docker-compose -f infra/docker-compose.yml up -d

# Or run individually:
cd frontend && npm install && npm run dev
cd backend && npm install && npm start  
cd agent && pip install -r requirements.txt && python main.py
```

## 4. Access Application

- **Frontend**: http://localhost:3003
- **Backend API**: http://localhost:3001
- **AI Agent**: http://localhost:3002

## 5. Demo Flow

1. Connect MetaMask wallet
2. Create delegation (set limits)
3. Trigger APY change event
4. Watch AI execute automatically
5. Check audit log

## Troubleshooting

- **Port conflicts**: Change ports in docker-compose.yml
- **API errors**: Check API keys in .env
- **Database issues**: Run `docker-compose down -v` then up again