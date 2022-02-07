import React, { useState, useEffect } from "react";
import '../../App.css';

import Web3 from "web3";

import {
    NotificationContainer,
    NotificationManager
} from "react-notifications";
import "react-notifications/lib/notifications.css";
import { config } from "../../config";

var namehash = require('eth-ens-namehash');
let web3, contract;

const Home = () => {


    const [selectedAddress, setSelectedAddress] = useState("");
    const [newUser, setNewUser] = useState(true);

    const [username, setUsername] = useState("");
    const [hash, setHash] = useState("");
    const [message, setMessage] = useState("");
    const [registerEnable, setRegisterEnable] = useState(false);

    useEffect(() => {
        async function init() {
            if (
                typeof window.ethereum !== "undefined" &&
                window.ethereum.isMetaMask
            ) {
                // Ethereum user detected. You can now use the provider.
                const provider = window["ethereum"];
                await provider.enable();
                if (provider.networkVersion === "3") {
                    // domainData.chainId = 3;
                    web3 = new Web3(provider);

                    contract = new web3.eth.Contract(
                        config.contract.abi,
                        config.contract.address
                    );
                    setSelectedAddress(provider.selectedAddress);
                    userExists(provider.selectedAddress);
                    provider.on("accountsChanged", function (accounts) {
                        setSelectedAddress(accounts[0]);
                        userExists(accounts[0]);
                    });
                    provider.on("chainChanged", function (chain) {
                        showErrorMessage("Please change the network in metamask to Ropsten");
                    });
                } else {
                    showErrorMessage("Please change the network in metamask to Ropsten");
                }
            } else {
                showErrorMessage("Metamask not installed");
            }
        }
        init();
    }, []);

    const userExists = (address) => {
        if (web3 && contract) {
            contract.methods.userExists(address).call().then((result) => {
                if (result[0]) {
                    setNewUser(false);
                    setRegisterEnable(false);
                    setHash(result[1]);
                    setMessage("");
                }
                else {
                    setNewUser(true);
                }
            })
        }
    }

    const showErrorMessage = message => {
        NotificationManager.error(message, "Error", 5000);
    };

    const showSuccessMessage = message => {
        NotificationManager.success(message, "Message", 3000);
    };

    const showInfoMessage = message => {
        NotificationManager.info(message, "Info", 3000);
    };

    const onSubmit = (e) => {
        e.preventDefault();
        var normalized = namehash.normalize(username);
        var hash = namehash.hash(normalized+".prox");
        console.log(hash);
        if(web3 && contract) {
            contract.methods.recordExists(hash).call().then((result) => {
                console.log(result);
                if(!result) {
                    setRegisterEnable(true);
                    setHash(hash);
                    setMessage("Username is Available");
                }
                else {
                    setMessage("Username Already Taken");
                }
            });
        }
    }

    const register = (e) => {
        if(web3 && contract) {
            contract.methods.setDSIRecord(hash).send({ from: selectedAddress}).then((result) => {
                console.log(result);
                if(result.events.RecordCreated && result.events.RecordCreated.returnValues[0]===selectedAddress) {
                    setHash(result.events.RecordCreated.returnValues[0]);
                    setNewUser(false);
                    setRegisterEnable(false);
                    showSuccessMessage("Successfully created username");
                }
                else {
                    showErrorMessage("Username creation failed");
                }
            })
        }
    }

    const newForm = () => {
        return(
            <div>
                <p>Welcome to Procial</p>
                <div><input type="text" value={username} placeholder="Search username" onChange={e => {setUsername(e.target.value)}}/><p>.prox</p></div>
                <button type="button" onClick={onSubmit}>Check</button><br/><br/>
            </div>
        )
    }

    const userComponent = () => {
        return(
            <div>
                <h1>Welcome Back!</h1>
                <p>{username}</p>
                <p>{hash}</p>
                <button>Go To Profile</button>
            </div>
        )
    }

    return (
        <div className="App">
            <h1>{selectedAddress}</h1>
            {newUser ? newForm() : userComponent()}
            {registerEnable ? <button onClick={register}>Register</button> : <></>}
            <p>{message}</p>
            <NotificationContainer />
        </div>
    );
}

export default Home;