//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface InstaFlashReceiverInterface {
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata _data
    ) external returns (bool);

    function cast(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata _data
    ) external returns (bool);
}

interface IndexInterface {
    function master() external view returns (address);

    function list() external view returns (address);
}

interface ListInterface {
    function accountID(address) external view returns (uint64);
}

interface TokenInterface {
    function approve(address, uint256) external;

    function transfer(address, uint256) external;

    function transferFrom(
        address,
        address,
        uint256
    ) external;

    function deposit() external payable;

    function withdraw(uint256) external;

    function balanceOf(address) external view returns (uint256);

    function decimals() external view returns (uint256);

    function allowance(address, address) external view returns (uint256);
}

interface ProtocolFeesCollector {
    function getFlashLoanFeePercentage() external view returns (uint256);
}

interface IBalancerLending {
    function flashLoan(
        InstaFlashReceiverInterface recipient,
        IERC20[] memory tokens,
        uint256[] memory amounts,
        bytes memory userData
    ) external;
    function getProtocolFeesCollector() external view returns (ProtocolFeesCollector);
}
