
 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract DatasetRegistry {
    struct VersionRecord {
        bytes32 sha256;
        bytes32 previousSha256;
        address registrant;
        uint64 timestamp;
    }

    mapping(string => VersionRecord[]) private versions;
    mapping(string => address) private datasetOwner;

    error EmptyDatasetId();
    error ZeroHash();
    error DuplicateLatestHash();
    error NotDatasetOwner();
    error DatasetNotFound();
    error VersionNotFound();

    event DatasetVersionRegistered(
        string datasetId,
        uint256 version,
        bytes32 sha256,
        address registrant
    );

    function registerVersion(
        string calldata datasetId,
        bytes32 sha256
    ) external returns (uint256 version) {
        if (bytes(datasetId).length == 0) revert EmptyDatasetId();
        if (sha256 == bytes32(0)) revert ZeroHash();

        VersionRecord[] storage history = versions[datasetId];

        if (history.length == 0) {
            datasetOwner[datasetId] = msg.sender;
        } else {
            if (datasetOwner[datasetId] != msg.sender) {
                revert NotDatasetOwner();
            }

            if (history[history.length - 1].sha256 == sha256) {
                revert DuplicateLatestHash();
            }
        }

        bytes32 previousHash;

        if (history.length > 0) {
            previousHash = history[history.length - 1].sha256;
        }

        history.push(
            VersionRecord({
                sha256: sha256,
                previousSha256: previousHash,
                registrant: msg.sender,
                timestamp: uint64(block.timestamp)
            })
        );

        version = history.length;

        emit DatasetVersionRegistered(
            datasetId,
            version,
            sha256,
            msg.sender
        );
    }

    function getVersion(
        string calldata datasetId,
        uint256 version
    ) external view returns (VersionRecord memory) {
        VersionRecord[] storage history = versions[datasetId];

        if (history.length == 0) revert DatasetNotFound();
        if (version == 0 || version > history.length) {
            revert VersionNotFound();
        }

        return history[version - 1];
    }

    function getLatest(
        string calldata datasetId
    ) external view returns (VersionRecord memory) {
        VersionRecord[] storage history = versions[datasetId];

        if (history.length == 0) revert DatasetNotFound();

        return history[history.length - 1];
    }

    function getVersionCount(
        string calldata datasetId
    ) external view returns (uint256) {
        if (versions[datasetId].length == 0) revert DatasetNotFound();

        return versions[datasetId].length;
    }

    function verify(
        string calldata datasetId,
        uint256 version,
        bytes32 sha256
    ) external view returns (bool) {
        VersionRecord[] storage history = versions[datasetId];

        if (history.length == 0) revert DatasetNotFound();
        if (version == 0 || version > history.length) {
            revert VersionNotFound();
        }

        return history[version - 1].sha256 == sha256;
    }
}
