const axios = require('axios');

class FarcasterService {
  constructor() {
    this.apiKey = process.env.FARCASTER_API_KEY;
    this.signerUuid = process.env.FARCASTER_SIGNER_UUID;
    this.baseUrl = 'https://api.neynar.com/v2/farcaster';
    this.appUrl = process.env.FARCASTER_APP_URL || 'https://ai-yield-agent.vercel.app';
  }

  async createCast(text, embeds = []) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/cast`,
        {
          signer_uuid: this.signerUuid,
          text,
          embeds
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating Farcaster cast:', error.response?.data || error.message);
      throw error;
    }
  }

  async createRebalanceNotification(data) {
    const { action, txHash, user, fromPool, toPool, amount, apy_improvement } = data;
    
    const text = `🤖 AI Yield Agent executed rebalance!\n\n` +
                `📊 Moved ${amount} ETH from ${fromPool} to ${toPool}\n` +
                `📈 APY improvement: +${apy_improvement}%\n` +
                `🔗 TX: ${txHash.slice(0, 10)}...\n\n` +
                `#DeFi #AI #YieldOptimization #Monad`;

    const embeds = [{
      url: `http://localhost:3004/frame/portfolio/${user}`
    }];

    return await this.createCast(text, embeds);
  }

  async createDelegationNotification(data) {
    const { user, maxAmount, expiry, poolCount } = data;
    
    const text = `🔐 New AI delegation created!\n\n` +
                `💰 Max amount: ${maxAmount} ETH\n` +
                `⏰ Expires: ${new Date(expiry).toLocaleDateString()}\n` +
                `🏊 Pools: ${poolCount} authorized\n\n` +
                `Ready for autonomous yield optimization!\n\n` +
                `#DeFi #Delegation #AI #SmartAccounts`;

    const embeds = [{
      url: `http://localhost:3004/frame/portfolio/${user}`
    }];

    return await this.createCast(text, embeds);
  }

  async createMiniAppFrame(actionData) {
    const { action, confidence, fromPool, toPool, amount } = actionData;
    
    const frameHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta property="fc:frame" content="vNext">
          <meta property="fc:frame:image" content="${this.appUrl}/api/frame/rebalance-preview">
          <meta property="fc:frame:button:1" content="✅ Approve">
          <meta property="fc:frame:button:2" content="❌ Reject">
          <meta property="fc:frame:post_url" content="${this.appUrl}/api/frame/action">
          <title>AI Yield Agent - Rebalance Approval</title>
        </head>
        <body>
          <div style="padding: 20px; font-family: Arial, sans-serif;">
            <h2>🤖 AI Yield Agent</h2>
            <p><strong>Proposed Action:</strong> ${action}</p>
            <p><strong>Confidence:</strong> ${(confidence * 100).toFixed(0)}%</p>
            <p><strong>From:</strong> ${fromPool}</p>
            <p><strong>To:</strong> ${toPool}</p>
            <p><strong>Amount:</strong> ${amount} ETH</p>
          </div>
        </body>
      </html>
    `;

    return frameHtml;
  }

  async handleFrameAction(buttonIndex, frameData) {
    try {
      const { action, user } = frameData;
      
      if (buttonIndex === 1) {
        // Approve action
        await this.executeApprovedAction(action, user);
        return {
          success: true,
          message: '✅ Action approved and executed!',
          image: `${this.appUrl}/api/frame/success`
        };
      } else {
        // Reject action
        await this.logRejectedAction(action, user);
        return {
          success: true,
          message: '❌ Action rejected by user',
          image: `${this.appUrl}/api/frame/rejected`
        };
      }
    } catch (error) {
      console.error('Error handling frame action:', error);
      return {
        success: false,
        message: '❌ Error processing action',
        image: `${this.appUrl}/api/frame/error`
      };
    }
  }

  async executeApprovedAction(action, user) {
    // Trigger AI agent to execute the approved action
    try {
      await axios.post('http://localhost:3003/execute-approved', {
        action,
        user,
        source: 'farcaster_frame'
      });
    } catch (error) {
      console.error('Error executing approved action:', error);
      throw error;
    }
  }

  async logRejectedAction(action, user) {
    // Log the rejected action for analytics
    try {
      await axios.post('http://localhost:3002/api/audit', {
        action: 'user_rejection',
        details: action,
        user,
        source: 'farcaster_frame',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging rejected action:', error);
    }
  }

  async createYieldAlert(data) {
    const { poolName, oldAPY, newAPY, change } = data;
    
    const emoji = change > 0 ? '📈' : '📉';
    const changeText = change > 0 ? 'increased' : 'decreased';
    
    const text = `${emoji} Yield Alert!\n\n` +
                `🏊 Pool: ${poolName}\n` +
                `📊 APY ${changeText}: ${oldAPY.toFixed(1)}% → ${newAPY.toFixed(1)}%\n` +
                `📈 Change: ${change > 0 ? '+' : ''}${change.toFixed(1)}%\n\n` +
                `AI is analyzing rebalance opportunities...\n\n` +
                `#DeFi #YieldFarming #AI`;

    return await this.createCast(text);
  }

  async createPortfolioUpdate(data) {
    const { totalValue, weightedAPY, dailyEarnings, positionCount } = data;
    
    const text = `📊 Portfolio Update\n\n` +
                `💰 Total Value: $${totalValue.toLocaleString()}\n` +
                `📈 Weighted APY: ${weightedAPY.toFixed(1)}%\n` +
                `💵 Daily Earnings: $${dailyEarnings.toFixed(2)}\n` +
                `🏊 Active Positions: ${positionCount}\n\n` +
                `Powered by AI optimization 🤖\n\n` +
                `#DeFi #Portfolio #AI`;

    const embeds = [{
      url: `${this.appUrl}/dashboard`
    }];

    return await this.createCast(text, embeds);
  }

  async createWeeklyReport(data) {
    const { weeklyReturn, bestPerformer, totalTransactions, gasOptimized } = data;
    
    const text = `📈 Weekly AI Report\n\n` +
                `💰 Weekly Return: ${weeklyReturn > 0 ? '+' : ''}${weeklyReturn.toFixed(2)}%\n` +
                `🏆 Best Performer: ${bestPerformer}\n` +
                `🔄 Transactions: ${totalTransactions}\n` +
                `⛽ Gas Optimized: $${gasOptimized.toFixed(2)}\n\n` +
                `AI keeps optimizing your yields! 🤖\n\n` +
                `#DeFi #WeeklyReport #AI`;

    return await this.createCast(text);
  }

  // Mini App specific methods
  async generateMiniAppUrl(actionId, userId) {
    const baseUrl = `${this.appUrl}/mini-app`;
    const params = new URLSearchParams({
      action: actionId,
      user: userId,
      timestamp: Date.now().toString()
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  async validateMiniAppRequest(signature, timestamp, userId) {
    // Implement signature validation for mini app requests
    // This would typically involve verifying the Farcaster signature
    try {
      // Simplified validation - in production, verify actual Farcaster signatures
      const now = Date.now();
      const requestTime = parseInt(timestamp);
      
      // Check if request is within 5 minutes
      if (now - requestTime > 5 * 60 * 1000) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating mini app request:', error);
      return false;
    }
  }
}

module.exports = FarcasterService;