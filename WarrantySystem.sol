// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract WarrantySystem {
    address public admin;

    struct Product {
        string productId;
        string productName;
        address customer;
        uint256 purchaseDate;
        uint256 warrantyEndDate;
        string status;
        bool exists;
    }

    struct RepairHistory {
        uint256 repairDate;
        string issue;
        string solution;
        string technician;
    }
z`
    mapping(string => Product) private products;
    mapping(string => RepairHistory[]) private repairHistories;

    event ProductAdded(string productId, string productName, address customer);
    event WarrantyStatusUpdated(string productId, string status);
    event RepairHistoryAdded(string productId, string issue, string solution);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can do this");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function addProduct(
        string memory _productId,
        string memory _productName,
        address _customer,
        uint256 _warrantyMonths
    ) public onlyAdmin {
        require(!products[_productId].exists, "Product already exists");
        require(_warrantyMonths > 0, "Warranty months must be greater than 0");

        uint256 purchaseDate = block.timestamp;
        uint256 warrantyEndDate = purchaseDate + (_warrantyMonths * 30 days);

        products[_productId] = Product(
            _productId,
            _productName,
            _customer,
            purchaseDate,
            warrantyEndDate,
            "Active",
            true
        );

        emit ProductAdded(_productId, _productName, _customer);
    }

    function updateWarrantyStatus(
        string memory _productId,
        string memory _status
    ) public onlyAdmin {
        require(products[_productId].exists, "Product does not exist");
        products[_productId].status = _status;
        emit WarrantyStatusUpdated(_productId, _status);
    }

    function addRepairHistory(
        string memory _productId,
        string memory _issue,
        string memory _solution,
        string memory _technician
    ) public onlyAdmin {
        require(products[_productId].exists, "Product does not exist");

        repairHistories[_productId].push(
            RepairHistory(
                block.timestamp,
                _issue,
                _solution,
                _technician
            )
        );

        emit RepairHistoryAdded(_productId, _issue, _solution);
    }

    function getProduct(
        string memory _productId
    )
        public
        view
        returns (
            string memory productId,
            string memory productName,
            address customer,
            uint256 purchaseDate,
            uint256 warrantyEndDate,
            string memory status,
            bool exists
        )
    {
        Product memory p = products[_productId];

        return (
            p.productId,
            p.productName,
            p.customer,
            p.purchaseDate,
            p.warrantyEndDate,
            p.status,
            p.exists
        );
    }

    function getRepairHistoryCount(
        string memory _productId
    ) public view returns (uint256) {
        return repairHistories[_productId].length;
    }

    function getRepairHistory(
        string memory _productId,
        uint256 _index
    )
        public
        view
        returns (
            uint256 repairDate,
            string memory issue,
            string memory solution,
            string memory technician
        )
    {
        require(_index < repairHistories[_productId].length, "Invalid index");

        RepairHistory memory history = repairHistories[_productId][_index];

        return (
            history.repairDate,
            history.issue,
            history.solution,
            history.technician
        );
    }

    function isWarrantyValid(
        string memory _productId
    ) public view returns (bool) {
        require(products[_productId].exists, "Product does not exist");
        return block.timestamp <= products[_productId].warrantyEndDate;
    }
}