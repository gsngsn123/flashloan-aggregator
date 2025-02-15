const hre = require("hardhat");
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
const { ethers } = hre;

import {
  InstaFlashAggregator,
  InstaFlashAggregator__factory,
  IERC20__factory,
  IERC20,
  InstaFlashReceiver__factory,
  InstaFlashReceiver,
  InstaFlashAggregatorProxy,
  InstaFlashAggregatorProxy__factory,
  InstaFlashAggregatorAdmin,
  InstaFlashAggregatorAdmin__factory,
} from "../../typechain";

describe("FlashLoan", function () {
  let Aggregator, aggregator, Receiver, receiver: InstaFlashReceiver, Proxy, proxy: InstaFlashAggregatorProxy, Admin, admin;
  let signer: SignerWithAddress;

  const master = '0xa8c31E39e40E6765BEdBd83D92D6AA0B33f1CCC5';
  const aaveLendingAddr = '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9';

  let ABI = [ "function initialize(address[])" ];
  let iface = new ethers.utils.Interface(ABI);
  const data = iface.encodeFunctionData("initialize", [[
    "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643", // DAI
    "0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9", // USDT
    "0x39AA39c021dfbaE8faC545936693aC917d5E7563", // USDC
    "0xe65cdb6479bac1e22340e4e755fae7e509ecd06c", // AAVE
    "0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e", // BAT
    "0x70e36f6bf80a52b3b46b3af8e106cc0ed743e8e4", // COMP
    "0xface851a4921ce59e912d19329929ce6da6eb0c7", // LINK
    "0x95b4ef2869ebd94beb4eee400a99824bf5dc325b", // MKR
    "0x158079ee67fce2f58472a96584a73c7ab9ac95c1", // REP
    "0x4b0181102a0112a2ef11abee5563bb4a3176c9d7", // SUSHI
    "0x12392f67bdf24fae0af363c24ac620a2f67dad86", // TUSD
    "0x35a18000230da775cac24873d00ff85bccded550", // UNI
    "0xccf4429db6322d5c611ee964527d42e5d685dd6a", // WBTC2
    "0x80a2ae356fc9ef4305676f7a3e2ed04e12c33946", // YFI
    "0xb3319f5d18bc0d84dd1b4825dcde5d5f7266d407" // ZRX
  ]])

  const DAI = "0x6b175474e89094c44da98b954eedeac495271d0f";
  const USDT = "0xdac17f958d2ee523a2206206994597c13d831ec7";
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const ACC_DAI = "0x9a7a9d980ed6239b89232c012e21f4c210f4bef1";
  const ACC_USDT = "0x6D5Be15f9Aa170e207C043CDf8E0BaDbF2A48ed0";
  const ACC_WETH = "0xe78388b4ce79068e89bf8aa7f218ef6b9ab0e9d0";

  const dai = ethers.utils.parseUnits("10", 18);
  const usdt = ethers.utils.parseUnits("10", 6);
  const weth = ethers.utils.parseUnits("10", 18);
  const Dai = ethers.utils.parseUnits("5000", 18);
  const Usdt = ethers.utils.parseUnits("5000", 6);
  const Weth = ethers.utils.parseUnits("1000", 18);
  const zeroAddr =
    "0x0000000000000000000000000000000000000000000000000000000000000000";

  beforeEach(async function () {
    [signer] = await ethers.getSigners();

    Aggregator = new InstaFlashAggregator__factory(signer);
    aggregator = await Aggregator.deploy();
    await aggregator.deployed();

    Admin = new InstaFlashAggregatorAdmin__factory(signer);
    admin = await Admin.deploy(master);
    await admin.deployed();

    Proxy = new InstaFlashAggregatorProxy__factory(signer);
    proxy = await Proxy.deploy(aggregator.address, admin.address, data);
    await proxy.deployed();

    Receiver = new InstaFlashReceiver__factory(signer);
    receiver = await Receiver.deploy(proxy.address);
    await receiver.deployed();

    const token_dai = new ethers.Contract(
      DAI,
      IERC20__factory.abi,
      ethers.provider
    );

    await hre.network.provider.send("hardhat_setBalance", [
      ACC_DAI,
      ethers.utils.parseEther("10.0").toHexString(),
    ]);

    await hre.network.provider.send("hardhat_setBalance", [
      proxy.address,
      ethers.utils.parseEther("10.0").toHexString(),
    ]);

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [ACC_DAI],
    });

    const signer_dai = await ethers.getSigner(ACC_DAI);
    await token_dai.connect(signer_dai).transfer(receiver.address, dai);

    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [ACC_DAI],
    });

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [proxy.address],
    });

    const signer_fla = await ethers.getSigner(proxy.address);
    await token_dai.connect(signer_fla).approve(aaveLendingAddr, 100);

    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [proxy.address],
    });
  });

  describe("Single token", async function () {
    it("Should be able to take flashLoan of a single token from AAVE", async function () {
      await receiver.flashBorrow([DAI], [Dai], 1, zeroAddr);
    });
    it("Should be able to take flashLoan of a single token from MakerDAO", async function () {
      await receiver.flashBorrow([DAI], [Dai], 2, zeroAddr);
    });
    it("Should be able to take flashLoan of a single token from Compound(MakerDAO)", async function () {
      await receiver.flashBorrow([DAI], [Dai], 3, zeroAddr);
    });
    it("Should be able to take flashLoan of a single token from AAVE(MakerDAO)", async function () {
      await receiver.flashBorrow([DAI], [Dai], 4, zeroAddr);
    });
    it("Should be able to take flashLoan of a single token from Balancer", async function () {
      await receiver.flashBorrow([DAI], [Dai], 5, zeroAddr);
    });
    it("Should be able to take flashLoan of a single token from Compound(Balancer)", async function () {
      await receiver.flashBorrow([DAI], [Dai], 6, zeroAddr);
    });
    it("Should be able to take flashLoan of a single token from AAVE(Balancer)", async function () {
      await receiver.flashBorrow([DAI], [Dai], 7, zeroAddr);
    });
  });

  describe("Multi token", async function () {
    beforeEach(async function () {
      const token_usdt = new ethers.Contract(
        USDT,
        IERC20__factory.abi,
        ethers.provider
      );

      const token_weth = new ethers.Contract(
        WETH,
        IERC20__factory.abi,
        ethers.provider
      );

      await hre.network.provider.send("hardhat_setBalance", [
        ACC_USDT,
        ethers.utils.parseEther("10.0").toHexString(),
      ]);

      await hre.network.provider.send("hardhat_setBalance", [
        ACC_WETH,
        ethers.utils.parseEther("10.0").toHexString(),
      ]);

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [ACC_USDT],
      });

      const signer_usdt = await ethers.getSigner(ACC_USDT);
      await token_usdt.connect(signer_usdt).transfer(receiver.address, usdt);

      await hre.network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [ACC_USDT],
      });

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [ACC_WETH],
      });

      const signer_weth = await ethers.getSigner(ACC_WETH);
      await token_weth.connect(signer_weth).transfer(receiver.address, weth);

      await hre.network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [ACC_WETH],
      });

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [proxy.address],
      });
  
      const signer_fla = await ethers.getSigner(proxy.address);
      await token_usdt.connect(signer_fla).approve(aaveLendingAddr, 100);
  
      await hre.network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [proxy.address],
      });

    });
    it("Should be able to take flashLoan of multiple tokens together from AAVE", async function () {
      await receiver.flashBorrow([DAI, USDT, WETH], [Dai, Usdt, Weth], 1, zeroAddr);
    });
    it("Should be able to take flashLoan of multiple tokens together from MakerDAO", async function () {
      await receiver.flashBorrow([DAI, USDT, WETH], [Dai, Usdt, Weth], 2, zeroAddr);
    });
    it("Should be able to take flashLoan of multiple tokens together from Compound(MakerDAO)", async function () {
      await receiver.flashBorrow([DAI, USDT, WETH], [Dai, Usdt, Weth], 3, zeroAddr);
    });
    it("Should be able to take flashLoan of multiple tokens together from AAVE(MakerDAO)", async function () {
      await receiver.flashBorrow([DAI, USDT, WETH], [Dai, Usdt, Weth], 4, zeroAddr);
    });
    it("Should be able to take flashLoan of multiple sorted tokens together from Balancer", async function () {
      await receiver.flashBorrow([DAI, USDT, WETH], [Dai, Usdt, Weth], 5, zeroAddr);
    });
    it("Should be able to take flashLoan of multiple unsorted tokens together from Balancer", async function () {
      await receiver.flashBorrow([USDT, DAI, WETH], [Usdt, Dai, Weth], 5, zeroAddr);
    });
    it("Should be able to take flashLoan of multiple tokens together from Compound(Balancer)", async function () {
      await receiver.flashBorrow([DAI, USDT, WETH], [Dai, Usdt, Weth], 6, zeroAddr);
    });
    it("Should be able to take flashLoan of multiple tokens together from AAVE(Balancer)", async function () {
      await receiver.flashBorrow([DAI, USDT, WETH], [Dai, Usdt, Weth], 7, zeroAddr);
    });
  });
});
