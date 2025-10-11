const express = require('express');
const SmartAccountService = require('../services/smart-account-service');

const router = express.Router();

// Use global instance for shared state
function getSmartAccountService(req) {
  return req.app.locals.smartAccountService || new SmartAccountService();
}

// Execute delegated transaction
router.post('/execute', async (req, res) => {
  try {
    const smartAccountService = getSmartAccountService(req);
    const result = await smartAccountService.executeDelegatedTransaction(req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get delegations for Smart Account
router.get('/delegations/:address', async (req, res) => {
  try {
    // Prevent caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    const smartAccountService = getSmartAccountService(req);
    const delegations = await smartAccountService.getDelegations(req.params.address);
    res.json({ success: true, delegations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Store delegation
router.post('/delegations', async (req, res) => {
  try {
    const smartAccountService = getSmartAccountService(req);
    const delegationData = {
      hash: '0x' + Math.random().toString(16).substr(2, 64),
      delegate: req.body.delegate,
      authority: req.body.authority,
      maxAmount: req.body.maxAmount,
      expiryHours: req.body.expiryHours,
      userAddress: req.body.userAddress,
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    
    await smartAccountService.storeDelegation(delegationData);
    
    res.json({ 
      success: true, 
      delegation: delegationData,
      txHash: '0x' + Math.random().toString(16).substr(2, 64)
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Revoke delegation
router.post('/delegations/:id/revoke', async (req, res) => {
  try {
    const smartAccountService = getSmartAccountService(req);
    await smartAccountService.revokeDelegation(req.params.id);
    res.json({ 
      success: true,
      txHash: '0x' + Math.random().toString(16).substr(2, 64)
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get execution history
router.get('/history/:address', async (req, res) => {
  try {
    const smartAccountService = getSmartAccountService(req);
    const history = await smartAccountService.getExecutionHistory(req.params.address);
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;