//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


import {Variables} from "./variables.sol";
import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import { 
    IndexInterface,
    ListInterface,
    TokenInterface,
    IAaveLending, 
    InstaFlashReceiverInterface
} from "./interfaces.sol";

contract Helper is Variables {
    using SafeERC20 for IERC20;

    // Helpers
    function safeApprove(
        FlashloanVariables memory _instaLoanVariables,
        uint256[] memory _fees,
        address _receiver
    ) internal {
        require(_instaLoanVariables._tokens.length == _instaLoanVariables._amounts.length, "Lengths of parameters not same");
        require(_instaLoanVariables._tokens.length == _fees.length, "Lengths of parameters not same");
        uint256 length_ = _instaLoanVariables._tokens.length;
        for (uint i = 0; i < length_; i++) {
            IERC20 token = IERC20(_instaLoanVariables._tokens[i]);
            token.safeApprove(_receiver, _instaLoanVariables._amounts[i] + _fees[i]);
        }
    }

    function safeTransfer(
        FlashloanVariables memory _instaLoanVariables,
        address _receiver
    ) internal {
        require(_instaLoanVariables._tokens.length == _instaLoanVariables._amounts.length, "Lengths of parameters not same");
        uint256 length_ = _instaLoanVariables._tokens.length;
        for (uint i = 0; i < length_; i++) {
            IERC20 token = IERC20(_instaLoanVariables._tokens[i]);
            token.safeTransfer(_receiver, _instaLoanVariables._amounts[i]);
        }
    }

    function calculateBalances(
        address[] memory _tokens,
        address _account
    ) internal view returns (uint256[] memory) {
        uint256 _length = _tokens.length;
        uint256[] memory balances_ = new uint256[](_length);
        for (uint i = 0; i < _length; i++) {
            IERC20 token = IERC20(_tokens[i]);
            balances_[i] = token.balanceOf(_account);
        }
        return balances_;
    }

    function validateFlashloan(
        FlashloanVariables memory _instaLoanVariables
    ) internal pure {
        for (uint i = 0; i < _instaLoanVariables._iniBals.length; i++) {
            require(_instaLoanVariables._iniBals[i] + _instaLoanVariables._instaFees[i] <= _instaLoanVariables._finBals[i], "amount-paid-less");
        }
    }

    function validateTokens(address[] memory _tokens) internal pure {
        for (uint i = 0; i < _tokens.length - 1; i++) {
            require(_tokens[i] != _tokens[i+1], "non-unique-tokens");
        }
    }

    function calculateFeeBPS(uint256 _route) public view returns(uint256 BPS_){
        if (_route == 1) {
            BPS_ = aaveLending.FLASHLOAN_PREMIUM_TOTAL();
        } else {
            require(false, "Invalid source");
        }
        
        if (BPS_ < InstaFeeBPS) {
            BPS_ = InstaFeeBPS;
        }
    }

    function calculateFees(uint256[] memory _amounts, uint256 _BPS) internal pure returns (uint256[] memory) {
        uint256 length_ = _amounts.length;
        uint256[] memory InstaFees = new uint256[](length_);
        for (uint i = 0; i < length_; i++) {
            InstaFees[i] = (_amounts[i] * _BPS) / (10 ** 4);
        }
        return InstaFees;
    }

    function bubbleSort(address[] memory _tokens, uint256[] memory _amounts) internal pure returns (address[] memory, uint256[] memory) {
        for (uint256 i = 0; i < _tokens.length - 1; i++) {
            for( uint256 j = 0; j < _tokens.length - i - 1 ; j++) {
                if(_tokens[j] > _tokens[j+1]) {
                    (_tokens[j], _tokens[j+1], _amounts[j], _amounts[j+1]) = (_tokens[j+1], _tokens[j], _amounts[j+1], _amounts[j]);
                }
            }
        }
        return (_tokens, _amounts);
    }

    function checkIfDsa(address _account) internal view returns (bool) {
        return instaList.accountID(_account) > 0;
    }

    modifier verifyDataHash(bytes memory data_) {
        bytes32 dataHash_ = keccak256(data_);
        require(dataHash_ == dataHash && dataHash_ != bytes32(0), "invalid-data-hash");
        require(status == 2, "already-entered");
        dataHash = bytes32(0);
        _;
        status = 1;
    }

    modifier reentrancy {
        require(status == 1, "already-entered");
        status = 2;
        _;
        require(status == 1, "already-entered");
    }
}