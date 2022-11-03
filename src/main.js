import Web3 from "web3";
import { newKitFromWeb3 } from "@celo/contractkit";
import votingAbi from "../contract/voting.abi.json";

const ERC20_DECIMALS = 18;
const votingAddress = "0x77B4841F55a382b8d14F53bCFe0eF1fe9420BAb3";


let kit;
let contract;
let products = [];

const connectCeloWallet = async function () {
  if (window.celo) {
    notification("⚠️ Please approve this DApp to use it.");
    try {
      await window.celo.enable();
      notificationOff();

      const web3 = new Web3(window.celo);
      kit = newKitFromWeb3(web3);

      const accounts = await kit.web3.eth.getAccounts();
      kit.defaultAccount = accounts[0];

      contract = new kit.web3.eth.Contract(votingAbi, votingAddress);
    } catch (error) {
      notification(`⚠️ ${error}.`);
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.");
  }
};

// async function approve(_price) {
//   const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress)

//   const result = await cUSDContract.methods
//     .approve(votingAddress, _price)
//     .send({ from: kit.defaultAccount })
//   return result
// }

const getBalance = async function () {
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount);
  const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2);
  document.querySelector("#balance").textContent = cUSDBalance;
};

const Idlength = async function () {
  const _productsLength = await contract.methods.ID().call();
  const _products = [];
  for (let i = 1; i < _productsLength; i++) {
    let _product = new Promise(async (resolve, reject) => {
      let result = await contract.methods.getVoteDetails(i).call();
      console.log(result)
      var myDate = new Date(result[4] * 1000);
      var localdate;
      if(Math.floor(Date.now() / 1000) >= result[4]){
        localdate = '<span class="text-danger"> Ended <span>'
      } else{
        localdate = myDate.toLocaleString();
      }
      
      console.log(myDate)
      resolve({
        index: i,
        owner: result[0],
        name: result[1],
        details: result[2],
        noOfVote: result[3],
        duration: localdate,
        image: result[5],
        No: result[6],
        Undecided: result[7],
        Yes: result[8]
      });
    });
    _products.push(_product);
  }
  products = await Promise.all(_products);
  console.log("products", products);
  renderProducts();
};

function renderProducts() {
  document.getElementById("marketplace").innerHTML = "";
  products.forEach((_product) => {
    const newDiv = document.createElement("div");
    newDiv.className = "col-md-4";
    newDiv.innerHTML = productTemplate(_product);
    document.getElementById("marketplace").appendChild(newDiv);
  });
}

function productTemplate(_product) {
  console.log("res", _product.owner);
  return `
    <div class="card mb-4">
      <img class="card-img-top" src="${_product.image}" alt="...">
      <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start">
        ${_product.noOfVote} Vote
      </div>
      <div class="card-body text-left p-4 position-relative">
        <div class="translate-middle-y position-absolute top-0">
        ${identiconTemplate(_product.owner)}
        </div>
        <h2 class="card-title fs-4 fw-bold mt-2">${_product.name}</h2>
        <p class="card-text mb-4" style="min-height: 82px">
          ${_product.details}             
        </p>
        <p class="card-text mt-4">
          <i class="bi bi-clock-fill"></i>
          <span>Vote Ends in: <span class="text-info"> ${_product.duration}</span></span>
        </p>

        <div class="d-flex justify-content-around gap-2 mb-2">
        <a class="btn btn-lg btn-outline-dark badBtn fs-6 p-3" id=${_product.index} >
        No <br> <span class="text-primary display-6">  ${_product.No} </span> </a>

        <a class="btn btn-lg btn-outline-dark averageBtn fs-6 p-3" id=${_product.index}>
        Undecided <br> <span class="text-primary display-6">  ${_product.Undecided} </span></a>

        <a class="btn btn-lg btn-outline-dark goodBtn fs-6 p-3" id=${_product.index}>
        Yes <br> <span class="text-primary display-6">  ${_product.Yes} </span> </a>
      </div>

        <div class="d-grid gap-2">
          <a class="btn btn-lg btn-outline-dark voteResultBtn fs-6 p-3" id=${
            _product.index
          }>
            Get Vote Result
          </a>
        </div>
      </div>
    </div>
  `;
}

function identiconTemplate(_address) {
  const icon = blockies
    .create({
      seed: _address,
      size: 8,
      scale: 16,
    })
    .toDataURL();

  return `
  <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
    <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
        target="_blank">
        <img src="${icon}" width="48" alt="${_address}">
    </a>
  </div>
  `;
}

function notification(_text) {
  document.querySelector(".alert").style.display = "block";
  document.querySelector("#notification").textContent = _text;
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none";
}

window.addEventListener("load", async () => {
  notification("⌛ Loading...");
  await connectCeloWallet();
  await getBalance();
  // await getProducts()
  await Idlength();
  notificationOff();
});


document.querySelector("#marketplace").addEventListener("click", async (e) => {
  if (e.target.className.includes("voteResultBtn")) {
    const index = e.target.id;
    notification("⌛ Fetching Vote Result...");
    try {
      const result = await contract.methods
      .getVoteDetails(index)
      .send({ from: kit.defaultAccount })
    } catch (error) {
      notification(`⚠️ Error fetching VoteResult...`);
      return;
    }
    notification(`🎉 Vote result fetch successfully successfully.`)
    await Idlength()
  }
});

// document.querySelector("#marketplace").addEventListener("click", async (e) => {
//   const _products = [];
//   if (e.target.className.includes("voteResultBtn")) {
//     const index = e.target.id;
//     let _product = new Promise(async (resolve, reject) => {
//       console.log(index)
//       let result = await contract.methods.getVoteDetails(index).call();
//       console.log("my res",result)
//       var myDate = new Date(result[3] * 1000);
//       var localdate = myDate.toLocaleString();
//       console.log(myDate)
//       resolve({
//         owner: result[0],
//         name: result[1],
//         noOfVote: result[2],
//         duration: localdate,
//         image: result[4],
//         bad: result[5],
//         average: result[6],
//         good: result[7]
//       });
//     });
//     _products.push(_product);
//   }
//   products = await Promise.all(_products);
//   console.log("products", products);
//   renderProducts();
// });

/***********************Bad BTN**************** */
document.querySelector("#marketplace").addEventListener("click", async (e) => {
  if (e.target.className.includes("badBtn")) {
    const index = e.target.id;
    const value = e.target.value;
    notification(`⌛ ${kit.defaultAccount} voting for No...`)
    try {
      const result = await contract.methods
      .Vote(index, 0)
      .send({ from: kit.defaultAccount })
    } catch (error) {
      notification(`⚠️ ${error} Error in Voting...`);
      return;
    }
    notification(`🎉 You've Voted successfully.`)
    await Idlength()
  }
});

/*************************Average BTN****************** */
document.querySelector("#marketplace").addEventListener("click", async (e) => {
  if (e.target.className.includes("averageBtn")) {
    const index = e.target.id;
    const value = e.target.value;
    notification(`⌛ ${kit.defaultAccount} voting for Undecided...`)
    try {
      const result = await contract.methods
      .Vote(index, 1)
      .send({ from: kit.defaultAccount })
    } catch (error) {
      notification(`⚠️ ${error} Error in Voting...`);
      return;
    }
    notification(`🎉 You've Voted successfully.`)
    await Idlength()
  }
});


/********************Good btn*********************** */
document.querySelector("#marketplace").addEventListener("click", async (e) => {
  if (e.target.className.includes("goodBtn")) {
    const index = e.target.id;
    const value = e.target.value;
    console.log(value)
    notification(`⌛ ${kit.defaultAccount} voting for Yes...`)
    try {
      const result = await contract.methods
      .Vote(index, 2)
      .send({ from: kit.defaultAccount })
    } catch (error) {
      notification(`⚠️ ${error} Error in Voting...`);
      return;
    }
    notification(`🎉 You've Voted successfully.`)
    await Idlength()
  }
});

/******************Create New Poll********************* */
    document
    .querySelector("#create-NewPoll-Btn")
    .addEventListener("click", async (e) => {
      notification(`⌛ ${kit.defaultAccount} Creating New Poll...`)
      const topic = document.getElementById("newPollTopic").value
      const duration = document.getElementById("newPollDuration").value
      const pollUrl = document.getElementById("newPollBannerUrl").value
      const pollDetails = document.getElementById("newPollDetails").value
      //const input = document.getElementById("NewNumber").value
      console.log(topic, duration, pollUrl, pollDetails)
      try {
        const result = await contract.methods
        .createVote(topic, duration, pollUrl, pollDetails)
        .send({ from: kit.defaultAccount })
        console.log(result)
      } catch (error) {
        notification(`⚠️ oops, an error occured`)
        return;
      }
      notification(`🎉 ${topic} Poll created successfully.`)
      await Idlength();
    }) 

    /**********************Get Time Left****************** */
    //   document.querySelector("#marketplace").addEventListener("click", async (e) => 
    document.querySelector("#marketplace").addEventListener("click", async (e) => {
      if (e.target.className.includes("countdownBtn")) {
        const index = e.target.id;
        console.log("index", index)
        notification(`⌛ ${kit.defaultAccount} fetching time...`)
        try {

          const result = await contract.methods
          .timeLeft(index)
          .send({ from: kit.defaultAccount })
          console.log("time", result)
          // if(result == 0){
          //   document.getElementById("countdown").innerHTML = "Poll Ended"

          // }else{
          //   console.log(await result)
            // const [days, hours, minutes, seconds] = (Number(result) * 1000);
            // console.log(days, hours, minutes, seconds)
            // document.getElementById("countdown").innerHTML = `Countdown ${days} ${hours} ${minutes} ${seconds}`
    
          //}
          //return result;
        } catch (error) {
          notification(`⚠️ ${error} oops an error occured...`);
          return;
        }
        notification(`🎉 Time fetched succesully successfully.`)        
      }
    });

//https://source.unsplash.com/uK_duTfkNJE/640x960
//https://source.unsplash.com/mkTqZN1NzhY/640x960
//https://source.unsplash.com/L4YGuSg0fxs/640x960
//0x9c3b5D772eF1D722fd5100E700019Baa85cb0dab initial deploy
// 2- 0x1e945668eF184502Bda9b1AF23fB5AF6304c291f
//new 0xdF804684BEDBd5C4bEc5f80c90Db381DA3dB9772