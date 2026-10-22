
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DatasetRegistry", function () {
  async function deployRegistry() {
    const Registry = await ethers.getContractFactory("DatasetRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();
    return registry;
  }

  function makeHash(text) {
    return ethers.keccak256(ethers.toUtf8Bytes(text));
  }

  it("registers the first version and emits an event", async function () {
    const registry = await deployRegistry();
    const [owner] = await ethers.getSigners();
    const datasetId = "dataset-001";
    const hash1 = makeHash("version 1");

    await expect(registry.registerVersion(datasetId, hash1))
      .to.emit(registry, "DatasetVersionRegistered")
      .withArgs(datasetId, 1, hash1, owner.address);

    const record = await registry.getVersion(datasetId, 1);

    expect(record.sha256).to.equal(hash1);
    expect(record.previousSha256).to.equal(ethers.ZeroHash);
    expect(record.registrant).to.equal(owner.address);
    expect(record.timestamp).to.be.greaterThan(0n);
    expect(await registry.getVersionCount(datasetId)).to.equal(1n);
  });

  it("links the second version to the first version", async function () {
    const registry = await deployRegistry();
    const datasetId = "dataset-001";
    const hash1 = makeHash("version 1");
    const hash2 = makeHash("version 2");

    await registry.registerVersion(datasetId, hash1);
    await registry.registerVersion(datasetId, hash2);

    const second = await registry.getVersion(datasetId, 2);
    const latest = await registry.getLatest(datasetId);

    expect(second.sha256).to.equal(hash2);
    expect(second.previousSha256).to.equal(hash1);
    expect(latest.sha256).to.equal(hash2);
    expect(await registry.getVersionCount(datasetId)).to.equal(2n);
  });

  it("verifies matching and mismatching fingerprints", async function () {
    const registry = await deployRegistry();
    const hash1 = makeHash("registered fingerprint");

    await registry.registerVersion("dataset-001", hash1);

    expect(await registry.verify("dataset-001", 1, hash1)).to.equal(true);
    expect(
      await registry.verify("dataset-001", 1, makeHash("different fingerprint"))
    ).to.equal(false);
  });

  it("rejects an empty dataset ID", async function () {
    const registry = await deployRegistry();

    await expect(
      registry.registerVersion("", makeHash("version 1"))
    ).to.be.revertedWithCustomError(registry, "EmptyDatasetId");
  });

  it("rejects a zero fingerprint", async function () {
    const registry = await deployRegistry();

    await expect(
      registry.registerVersion("dataset-001", ethers.ZeroHash)
    ).to.be.revertedWithCustomError(registry, "ZeroHash");
  });

  it("rejects registering the latest fingerprint twice", async function () {
    const registry = await deployRegistry();
    const hash1 = makeHash("version 1");

    await registry.registerVersion("dataset-001", hash1);

    await expect(
      registry.registerVersion("dataset-001", hash1)
    ).to.be.revertedWithCustomError(registry, "DuplicateLatestHash");
  });

  it("rejects registration by a non-owner", async function () {
    const registry = await deployRegistry();
    const [, other] = await ethers.getSigners();

    await registry.registerVersion("dataset-001", makeHash("version 1"));

    await expect(
      registry.connect(other).registerVersion(
        "dataset-001",
        makeHash("version 2")
      )
    ).to.be.revertedWithCustomError(registry, "NotDatasetOwner");
  });

  it("rejects reads for an unknown dataset", async function () {
    const registry = await deployRegistry();

    await expect(
      registry.getLatest("unknown-dataset")
    ).to.be.revertedWithCustomError(registry, "DatasetNotFound");

    await expect(
      registry.getVersionCount("unknown-dataset")
    ).to.be.revertedWithCustomError(registry, "DatasetNotFound");

    await expect(
      registry.getVersion("unknown-dataset", 1)
    ).to.be.revertedWithCustomError(registry, "DatasetNotFound");

    await expect(
      registry.verify("unknown-dataset", 1, makeHash("anything"))
    ).to.be.revertedWithCustomError(registry, "DatasetNotFound");
  });

  it("rejects invalid version numbers", async function () {
    const registry = await deployRegistry();
    await registry.registerVersion("dataset-001", makeHash("version 1"));

    await expect(
      registry.getVersion("dataset-001", 0)
    ).to.be.revertedWithCustomError(registry, "VersionNotFound");

    await expect(
      registry.getVersion("dataset-001", 2)
    ).to.be.revertedWithCustomError(registry, "VersionNotFound");

    await expect(
      registry.verify("dataset-001", 2, makeHash("anything"))
    ).to.be.revertedWithCustomError(registry, "VersionNotFound");
  });
});
