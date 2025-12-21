
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./openzeppelin/contracts/utils/Counters.sol";

contract GreenChain is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct CarbonCredit {
        uint256 id;
        address owner;
        uint256 price;
        bool isForSale;
    }

    mapping(uint256 => CarbonCredit) public carbonCredits;

    constructor() ERC721("GreenChain", "GRC") {}

    function createCredit(uint256 price) public returns (uint256) {
        require(price > 0, "Price must be greater than zero");
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(msg.sender, newItemId);
        
        carbonCredits[newItemId] = CarbonCredit(newItemId, msg.sender, price, true);

        return newItemId;
    }

    function buyCredit(uint256 id) public payable {
        CarbonCredit storage credit = carbonCredits[id];
        require(credit.isForSale, "This credit is not for sale.");
        require(msg.value >= credit.price, "Not enough ether to buy this credit.");

        address oldOwner = credit.owner;
        credit.owner = msg.sender;
        credit.isForSale = false;

        _transfer(oldOwner, msg.sender, id);

        payable(oldOwner).transfer(msg.value);
    }

    function updateCredit(uint256 id, uint256 newPrice, bool isForSale) public {
        require(ownerOf(id) == msg.sender, "Only owner can update");
        require(newPrice > 0, "Price must be greater than zero");

        CarbonCredit storage credit = carbonCredits[id];
        require(credit.id != 0, "Credit does not exist");

        credit.price = newPrice;
        credit.isForSale = isForSale;
    }
}

