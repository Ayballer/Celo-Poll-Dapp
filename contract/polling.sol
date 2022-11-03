//SPDX-License-Identifier:MIT

pragma solidity ^0.8.9;

contract voting{
    //@author: BlackAdam
    //This code allows a single poll to be created with 3 options (No, Undecided, Yes)
    //@dev: the options can be inreased and cutomize

    //declare an unassigned address here as owner
    address immutable owner;

    //The id of the poll is declared here
    uint32 public ID = 1;

    //the owner of the contract is set to the person that deploy the contract here
    constructor(){
        owner = msg.sender;
    }

    //this keeps the details of the poll/vote created
    //voteOwnerAddress: the address of the owner of the vote/poll
    //Topic: The topic/goal of your poll/vote
    //_noOfVOte: gives the total number of votes the poll/vote generated
    //rate: this keeps tracks of the enums we declared and the options declared there
    //voteCreated: this allow the users/voters to know if a poll/vote has been created
    //votingPeriod: this set the duration for the poll/vote that a user create

    struct voteDetails{
        string Topic;
        string Details;
        string bannerURL;
        uint120 _noOfVOte;
        rating rate;
        bool voteCreated;
        uint32 votingPeriod;

        address voteOwnerAddress; //20bytes
    //The options are declared, the vote/poll is restricted to this three options
    /// @dev: any new options should be added here, in the enums, in the vote functions and totalvote function
        uint32 No; // 4 byte
        uint32 Undecided;
        uint32 Yes; 
    }

    //these are the option that the voters/user can select from
    //No: 0, Undecided: 1, Yes: 2
    /// @dev: any new options can be added here and these can also be customized
    enum rating{
        No,
        Undecided,
        Yes   
    }

    //this map a uint to a voteDetails
    mapping (uint => voteDetails) _votedetails;

    //this keeps track of people who have voted before, to prevent an address from voting twice
    mapping(address => mapping(uint => bool)) hasVoted;

    //this checked if an address has voted before or not
    modifier voted(uint _id){
        require(hasVoted[msg.sender][_id] == false, "youve voted");
        _;
    }

    //this keep tracks of the voting duration
    modifier timeElapsed(uint _id){
        voteDetails storage VD =  _votedetails[_id];
        require(block.timestamp <= VD.votingPeriod, "Voting has ended");
        _;
    }

    //the vote/poll is created here
    function createVote(string memory _topic, uint duration, string memory bannerLink, string memory _details) external returns(uint, string memory){
        voteDetails storage VD =  _votedetails[ID];
        VD.voteOwnerAddress = msg.sender;
        VD.Topic = _topic;
        VD.Details = _details;
        VD.bannerURL = bannerLink;
        VD.voteCreated = true;
        VD.votingPeriod = uint32(block.timestamp + (duration * (1 days)));
        uint currentId = ID;
        ID++;
        return(currentId, "Created Succesfully");
    }

    //this function allows the user to vote 
    function Vote(uint32 _id, rating _rate) external voted(_id) timeElapsed(_id){
    //it checks if the rate/options the user has entered is not bigger than the number of options we have
        require(uint8(_rate) <= 2);
        voteDetails storage VD =  _votedetails[_id];
        require(VD.voteCreated == true, "invalid vote");
        hasVoted[msg.sender][_id] = true;
        VD.rate = _rate;
        VD._noOfVOte +=1; 

    //i am checking the rate the user entered and increasing it by 1
    /// @dev: if the options/choices has been increase
    //you need to add an if statement to check for the new options added also
        if (rating.Yes == _rate) VD.Yes +=1 ;
        if (rating.Undecided == _rate) VD.Undecided +=1;
        if (rating.No == _rate) VD.No +=1;       
    }
    
    // //this function gives the results 0f the vote/poll
    // function totalVote(uint32 _id) external view returns(uint32, uint32, uint32){
    //    voteDetails storage VD =  _votedetails[_id];
    // /// @dev:you need to add the choice/option that you included to be able to see the result
    //     return(VD.No, VD.Undecided, VD.Yes);
    // }

    //this gives the details of the votes
    function getVoteDetails(uint _id) external view returns(address, string memory, string memory, uint, uint32, string memory, uint32, uint32, uint32){
        voteDetails storage VD =  _votedetails[_id];
        require(VD.voteCreated == true, "invalid vote id");
        return(VD.voteOwnerAddress, VD.Topic, VD.Details, VD._noOfVOte, VD.votingPeriod, VD.bannerURL, VD.No, VD.Undecided, VD.Yes);
    }

    //this function returns the timeleft for a particular poll
    function timeLeft(uint _id) external view returns(uint32){
        voteDetails storage VD =  _votedetails[_id];
        return uint32(VD.votingPeriod - block.timestamp);

    }


}