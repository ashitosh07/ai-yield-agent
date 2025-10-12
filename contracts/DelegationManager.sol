// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DelegationManager
 * @dev Manages delegations for AI Yield Agent on Monad testnet
 */
contract DelegationManager {
    struct Delegation {
        address delegator;
        address delegate;
        address tokenAddress;
        uint256 maxAmount;
        uint256 usedAmount;
        uint256 expiry;
        bool active;
        bytes32 delegationHash;
    }

    mapping(bytes32 => Delegation) public delegations;
    mapping(address => bytes32[]) public userDelegations;
    
    event DelegationCreated(
        bytes32 indexed delegationHash,
        address indexed delegator,
        address indexed delegate,
        address tokenAddress,
        uint256 maxAmount,
        uint256 expiry
    );
    
    event DelegationExecuted(
        bytes32 indexed delegationHash,
        address indexed executor,
        uint256 amount,
        address target
    );
    
    event DelegationRevoked(
        bytes32 indexed delegationHash,
        address indexed delegator
    );

    function createDelegation(
        address delegate,
        address tokenAddress,
        uint256 maxAmount,
        uint256 expiry
    ) external returns (bytes32) {
        require(delegate != address(0), "Invalid delegate");
        require(tokenAddress != address(0), "Invalid token");
        require(maxAmount > 0, "Invalid amount");
        require(expiry > block.timestamp, "Invalid expiry");

        bytes32 delegationHash = keccak256(
            abi.encodePacked(
                msg.sender,
                delegate,
                tokenAddress,
                maxAmount,
                expiry,
                block.timestamp
            )
        );

        delegations[delegationHash] = Delegation({
            delegator: msg.sender,
            delegate: delegate,
            tokenAddress: tokenAddress,
            maxAmount: maxAmount,
            usedAmount: 0,
            expiry: expiry,
            active: true,
            delegationHash: delegationHash
        });

        userDelegations[msg.sender].push(delegationHash);

        emit DelegationCreated(
            delegationHash,
            msg.sender,
            delegate,
            tokenAddress,
            maxAmount,
            expiry
        );

        return delegationHash;
    }

    function executeDelegation(
        bytes32 delegationHash,
        address target,
        uint256 amount,
        bytes calldata data
    ) external {
        Delegation storage delegation = delegations[delegationHash];
        
        require(delegation.active, "Delegation not active");
        require(delegation.delegate == msg.sender, "Not authorized");
        require(delegation.expiry > block.timestamp, "Delegation expired");
        require(delegation.usedAmount + amount <= delegation.maxAmount, "Amount exceeds limit");

        delegation.usedAmount += amount;

        (bool success, ) = target.call(data);
        require(success, "Execution failed");

        emit DelegationExecuted(delegationHash, msg.sender, amount, target);
    }

    function revokeDelegation(bytes32 delegationHash) external {
        Delegation storage delegation = delegations[delegationHash];
        require(delegation.delegator == msg.sender, "Not authorized");
        require(delegation.active, "Already inactive");

        delegation.active = false;

        emit DelegationRevoked(delegationHash, msg.sender);
    }

    function getDelegation(bytes32 delegationHash) external view returns (Delegation memory) {
        return delegations[delegationHash];
    }

    function getUserDelegations(address user) external view returns (bytes32[] memory) {
        return userDelegations[user];
    }

    function isDelegationValid(bytes32 delegationHash) external view returns (bool) {
        Delegation memory delegation = delegations[delegationHash];
        return delegation.active && delegation.expiry > block.timestamp;
    }
}