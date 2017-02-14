import yo from 'yo-yo';
import { keyStore } from 'eth-lightwallet';
import store from 'store';
import { log, etherScanAddressUrl, etherScanTxHashUrl, oneDay, emptyWeb3Address } from 'weifund-util';
import Contracts from 'weifund-contracts';
import BigNumber from 'bignumber.js';
import lightwallet from 'eth-lightwallet';

import { el } from '../document';
import { setDefaultAccount, getDefaultAccount, getCampaign, setCampaign,
  getNetwork, getLocale, validCampaigns, getContractEnvironment, txObject } from '../environment';
import { viewLoader, accountView } from '../components';
import { web3, getTransactionSuccess, setMetamaskProvider } from '../web3';
import { ipfs } from '../ipfs';
import { refreshPageButtons, getRouter } from '../router';
import { t } from '../i18n';
import { openSubView } from '../views';
import { createEncryptedKeystore, setKeystore, setWalletProvider } from '../keystore';


function TokenUI(options) {
  return yo`<div>
<div class="row" style="padding-left: 15px; padding-right: 15px;">
  <div class="col-sm-12"
    style="padding: 20px; margin-bottom: 5px;
      background: #FFF; border-bottom: 2px solid #999;">
    <div class="row">
  <div class="col-sm-12">
    <h3 class="row">
      <div class="col-xs-6">
        ${options.name}
        <small>(${options.symbol})</small>
      </div>
      <div class="col-xs-6 text-right">
        <a href=${etherScanAddressUrl(options.tokenAddress, getNetwork())}
          target="_blank"
          style="text-overflow:ellipsis;
          overflow: hidden; display: inline-block; width: 100%;">
          <small>
            <span data-tooltip="This is the Ethereum address of this token contract.">
              ${options.tokenAddress}
            </span>
          </small>
        </a>
      </div>
    </h3>
    <div class="row">
      <div class="col-xs-9">
        <h4>
          Tokens Owed ${options.tokensOwed.toString(10)}
          | Total Issued ${options.tokensIssued.toString(10)}
        </h4>
      </div>
      <div class="col-xs-3 text-right">
        <h4>
          Status <i>${options.claimed && 'claimed' || 'unclaimed'}</i>
        </h4>
      </div>
    </div>

    <hr />

    <div class="row">
      <div class="col-sm-6 text-left">
        <h4>
          Balance <b>${options.accountTokenBalance.toString(10) || '0'}</b>
          <small>${options.symbol}</small>
        </h4>
      </div>
      <div class="col-sm-6 text-right">
        <button class="btn btn-success ${options.canClaim && '' || 'disabled'}"
          style=${options.claimed && 'display: none;' || 'display: inline-block;'}
          onclick=${() => {
            if (options.canClaim) {
              const claimWindowEl = el(`#tokenClaimWindow_${options.tokenAddress}`);
              claimWindowEl.style.display = 'block';
              claimWindowEl.innerHTML = '';
              claimWindowEl.appendChild(yo`<span>
                <h3 style="margin-top: 0px;">Processing Claim</h3>
                Awaiting transaction confirmation..
              </span>`);

              options.enhancer.claim.sendTransaction({
                from: getDefaultAccount(),
                gas: txObject().gas,
              }, (claimError, txHash) => {
                if (claimError) {
                  claimWindowEl.innerHTML = '';
                  claimWindowEl.appendChild(yo`<span>
                    <h3 style="margin-top: 0px;">Transaction Error</h3>
                    There was an error while claiming your tokens...
                    <hr />
                    ${String(claimError)}
                  </span>`);
                }

                if (txHash) {
                  claimWindowEl.innerHTML = '';
                  claimWindowEl.appendChild(yo`<span>
                    <h3 style="margin-top: 0px;">Processing Claim</h3>
                    Your claim transaction is processing with transaction hash:
                    <hr />
                    <a href=${etherScanTxHashUrl(txHash, getNetwork())}
                      style="color: #FFF"
                      target="_blank">
                      ${txHash}
                    </a>
                  </span>`);

                  getTransactionSuccess(txHash, (successError, txReceipt) => {
                    if (!successError && txReceipt) {
                      claimWindowEl.innerHTML = '';
                      claimWindowEl.appendChild(yo`<span>
                        <h3 style="margin-top: 0px;">Claim Transaction Success!</h3>
                        Claim transaction success, please refresh the page.
                        <hr />
                        <a href=${etherScanTxHashUrl(txHash, getNetwork())}
                          style="color: #FFF"
                          target="_blank">
                          ${txHash}
                        </a>
                      </span>`);
                    }
                  });
                }
              });
            } else {
              el(`#tokenClaimWarning_${options.tokenAddress}`).style.display = 'block';
            }
          }}>
          Claim Tokens
        </button>
      </div>
    </div>

    <div class="row" id=${`tokenTransferWindow_${options.tokenAddress}`}
      style="display: none;">
      <div class="col-sm-12">
        <hr />
      </div>

      <div class="col-sm-5">
        <input type="text" id=${`tokenTransferAccount_${options.tokenAddress}`}
        placeholder="address"
          class="form-control"  />
      </div>

      <div class="col-sm-4 col-md-4 col-lg-4">
        <input type="number" id=${`tokenTransferAmount_${options.tokenAddress}`}
        placeholder="token amount"
          class="form-control" />
      </div>

      <div class="col-sm-3 text-right">
        <button id="transferToken" class="btn btn-primary">
          Transfer Amount
        </button>
      </div>
    </div>
  </div>
</div></div></div>
  <div class="row alert alert-info" id=${`tokenClaimWindow_${options.tokenAddress}`}
    style="display: none; padding: 16px;">
  </div>
  <div class="row"
    id=${`tokenClaimWarning_${options.tokenAddress}`}
    style=${'display: none; padding: 16px;'}>
    <div class="col-xs-12 alert alert-info">
      Currently, you cannot claim your tokens due either:
      <br />
      (1) The campaign has not finished yet (i.e. is not at stage "Success")
      <br />
      (2) You have no tokens owed to you
      <br />
      (3) The token thaw period has not ended yet
      <hr />
      ${options.stage.eq(2) === false && `Note, campaign is at stage '${options.stage.toString(10)}'
      and must be at stage '2' (Success) to claim.` || ''}
    </div>
  </div>
  <div class="row" style=${options.canClaim
    && 'display: inline-block; padding: 16px;'
    || 'display: none; padding: 16px;'}>
    <div class="col-xs-12 alert alert-info">
      Please claim your tokens owed here by clicking 'Claim'.
    </div>
  </div>
</div>`;
}

function loadTokenFromEnhancer(enhancerAddress, contracts) {
  const IssuedToken = contracts.IssuedToken.factory;
  const Model1Enhancer = contracts.Model1Enhancer.factory;

  const enhancer = Model1Enhancer.at(enhancerAddress);

  web3.eth.getBlockNumber((err, blockNumber) => {
    enhancer.token((err, tokenAddress) => {
      enhancer.balanceOf(getDefaultAccount(), (err, tokensOwed) => {
        enhancer.startBlock((err, startBlock) => {
          enhancer.campaign((err, campaign) => {
            const campaignInstance = contracts.StandardCampaign.factory.at(campaign);

            campaignInstance.stage((err, stage) => {
              enhancer.tokensIssued((err, tokensIssued) => {
                enhancer.freezePeriod((err, freezePeriod) => {
                  enhancer.claimed(getDefaultAccount(), (err, claimed) => {
                    const token = IssuedToken.at(tokenAddress);
                    let canClaim = false;
                    let hasTokensOwed = false;

                    // the user can claim the tokens
                    if (new BigNumber(blockNumber).gte(startBlock.add(freezePeriod))
                      && stage.eq(2)
                      && !claimed) {
                      canClaim = true;
                    }

                    if (tokensOwed.gt(0)) {
                      hasTokensOwed = true;
                    }

                    const endBlock = startBlock.add(freezePeriod);
                    const blockDiff = new BigNumber(blockNumber).sub(endBlock);
                    const secondsDiff = blockDiff.times(25).toFixed(0);
                    const currentTimestamp = new BigNumber((new Date()).getTime() / 1000).round();
                    const thawTimestamp = currentTimestamp.add(secondsDiff);
                    const thawMinutes = new BigNumber(secondsDiff).dividedBy(60).toFixed(0);
                    const thawDate = new Date(thawTimestamp * 1000).toUTCString();

                    token.name((err, name) => {
                      token.balanceOf(getDefaultAccount(), (err, accountTokenBalance) => {
                        token.decimals((err, decimals) => {
                          token.totalSupply((err, totalSupply) => {
                            token.symbol((err, symbol) => {
                              token.version((err, version) => {
                                el('#tokens-loading').innerHTML = '';
                                el('#tokens').appendChild(TokenUI({
                                  enhancerAddress,
                                  name,
                                  decimals,
                                  claimed,
                                  canClaim,
                                  stage,
                                  hasTokensOwed,
                                  blockNumber,
                                  tokensOwed,
                                  totalSupply,
                                  enhancer,
                                  symbol,
                                  version,
                                  accountTokenBalance,
                                  tokenAddress,
                                  tokensIssued,
                                  startBlock,
                                  freezePeriod,
                                }));
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

function loadAccount() {
  const contracts = new Contracts(getContractEnvironment(), web3.currentProvider);
  const campaignRegistry = contracts.CampaignRegistry.instance();
  const StandardCampaign = contracts.StandardCampaign.factory;
  const BalanceClaim = contracts.BalanceClaim.factory;
  el('#view-focus').style.display = 'none';
  el('#view-account-restore').style.display = 'none';
  el('#view-account').style.display = 'block';

  openSubView('view-account-panel');

  if (web3.currentProvider.isMetaMask) {
    el('#account-download-wallet').style.display = 'none';
  } else {
    el('#account-download-wallet').style.display = 'inline-block';
  }

  function loadCampaignAddress(campaignID) {
    campaignRegistry.addressOf(campaignID, (err, campaignAddress) => {
      if (!err) {
        el('#refundCampaignAddress').appendChild(yo`<option value=${campaignAddress}>
          ${campaignAddress}
        </option>`);
      }
    });
  }

  // load campaign addresses for refund selector
  el('#refundCampaignAddress').appendChild(yo`<option>
    Select
  </option>`);
  validCampaigns().forEach(loadCampaignAddress);

  // get accounts
  web3.eth.getAccounts((err, accounts) => {
    setDefaultAccount(accounts[0]);

    // set accont address on the page
    el('#accountAddress').innerHTML = '';
    el('#accountAddress').href = etherScanAddressUrl(accounts[0], getNetwork());
    el('#accountAddress').appendChild(yo`<span>${accounts[0]}</span>`);

    web3.eth.getBalance(getDefaultAccount(), (err, accountBalance) => {
      const balance = accountBalance || '0';
      el('#accountBalanceEther').innerHTML = '';
      el('#accountBalanceWei').innerHTML = '';
      el('#accountBalanceEther').appendChild(yo`<span>${web3.fromWei(balance, 'ether').toString(10)}</span>`);
      el('#accountBalanceWei').appendChild(yo`<span>${web3.fromWei(balance, 'wei').toString(10)}</span>`);
    });

    el('#refundCampaignAddress').addEventListener('change', refundAddressChange);

    function refundAddressChange() {
      const campaignAddress = String(el('#refundCampaignAddress').value).trim().toLowerCase();

      el('#claimBalance').setAttribute('disabled', 'disabled');
      el('#claimRefundOwed').setAttribute('disabled', 'disabled');

      if (!web3.isAddress(campaignAddress)) {
        el('#refundTry').innerHTML = '';
        el('#refundCID_label').style.display = 'none';
        el('#refundCID').style.display = 'none';
        el('#refundCID').innerHTML = '';
        el('#refundTry').innerHTML = '';
        return;
      }

      el('#refundCID').innerHTML = '';

      const refundCampaign = StandardCampaign.at(campaignAddress);
      refundCampaign.totalContributionsBySender(getDefaultAccount(), (err, totalContributions) => {
        if (!err && totalContributions.gt(0)) {
          el('#claimBalance').removeAttribute('disabled');
          el('#claimRefundOwed').removeAttribute('disabled');
          const totalCont = totalContributions.toNumber(10);
          el('#refundCID_label').style.display = 'inline-block';
          el('#refundCID').style.display = 'inline-block';
          el('#refundCID').innerHTML = '';
          el('#refundTry').innerHTML = '';

          function contributionBySender(i) {
            refundCampaign.contributionsBySender(getDefaultAccount(), i, (cidErr, cid) => {
              if (!cidErr && cid) {
                el('#refundCID').appendChild(yo`<option value=${cid.toString(10)}>
                  #${cid.toString(10)}
                </option>`);
              }
            });
          }

          for (var i = 0; i < totalCont; i++) {
            contributionBySender(i);
          }
        } else {
          el('#claimBalance').setAttribute('disabled', 'disabled');
          el('#claimRefundOwed').setAttribute('disabled', 'disabled');
          el('#refundCID_label').style.display = 'none';
          el('#refundCID').style.display = 'none';
          el('#refundCID').innerHTML = '';
          el('#refundTry').innerHTML = '';
          el('#refundTry').appendChild(yo`<div class="alert alert-info">
            It looks like you didn't contribute to this campaign.
            No contribution ID's have been found.
          </div>`);
        }
      });
    };

    el('#claimBalance').addEventListener('click', () => {
      const campaignAddress = String(el('#refundCampaignAddress').value).trim().toLowerCase();
      const contributionID = parseInt(el('#refundCID').value, 10);
      const campaignInstance = StandardCampaign.at(campaignAddress);

      el('#account-claim-refund-response').style.display = 'block';
      el('#account-claim-refund-response').innerHTML = '';
      el('#account-claim-refund-response').appendChild(yo`<span>
        <h3 style="margin-top: 0px;">Balance Payout Processing</h3>
        <p>Awaiting transaction approval...</p>
      </span>`);

      campaignInstance.refundsClaimed(contributionID, (refundsClaimedError, refundsClaimed) => {
        campaignInstance.refundClaimAddress(contributionID, (claimAddressError, balanceClaimAddress) => {
          if (balanceClaimAddress === '0x'
              || balanceClaimAddress === '0x0000000000000000000000000000000000000000'
              || refundsClaimed !== true) {
            el('#account-claim-refund-response').style.display = 'block';
            el('#account-claim-refund-response').innerHTML = '';
            el('#account-claim-refund-response').appendChild(yo`<span>
              <h3 style="margin-top: 0px;">No Balance Claim Available</h3>
              <p>There is no balance claim available for this contribution ID.
              Please try claiming your refund first.
              </p>
            </span>`);
            return;
          }

          const balanceClaim = BalanceClaim.at(balanceClaimAddress);

          balanceClaim.claimBalance(Object.assign({}, txObject(), {
            from: getDefaultAccount(),
          }), (claimBalanceError, txHash) => {
            if (claimBalanceError) {
              el('#account-claim-refund-response').style.display = 'block';
              el('#account-claim-refund-response').innerHTML = '';
              el('#account-claim-refund-response').appendChild(yo`<span>
                <h3 style="margin-top: 0px;">Balance Claim Transaction Error</h3>
                <p>There was an error while sending your transaction..</p>
                <hr />
                <p>${String(claimBalanceError)}</p>
              </span>`);
              return;
            }

            if (txHash) {
              el('#account-claim-refund-response').style.display = 'block';
              el('#account-claim-refund-response').innerHTML = '';
              el('#account-claim-refund-response').appendChild(yo`<span>
                <h3 style="margin-top: 0px;">Balance Payout Processing</h3>
                <p>Your transaction is being processed..</p>
                <hr />
                view it on etherscan:
                <a href=${etherScanTxHashUrl(txHash, getNetwork())}
                  target="_blank"
                  style="color: #FFF;">
                  ${txHash}
                </a>
              </span>`);
            }

            getTransactionSuccess(txHash, (txSuccessError, txReceipt) => {
              if (!txSuccessError && txReceipt) {
                el('#account-claim-refund-response').style.display = 'block';
                el('#account-claim-refund-response').innerHTML = '';
                el('#account-claim-refund-response').appendChild(yo`<span>
                  <h3 style="margin-top: 0px;">Balance Claim Transaction Success!</h3>
                  <p>Your transaction was successfully sent.</p>
                  <hr />
                  view it on etherscan:
                  <a href=${etherScanTxHashUrl(txHash, getNetwork())}
                    target="_blank"
                    style="color: #FFF;">
                    ${txHash}
                  </a>
                </span>`);
              }
            });
          });
        });
      });
    });

    // refund campaign
    el('#claimRefundOwed').addEventListener('click', () => {
      const campaignAddress = String(el('#refundCampaignAddress').value).trim().toLowerCase();
      const contributionID = parseInt(el('#refundCID').value, 10);
      const campaignInstance = StandardCampaign.at(campaignAddress);

      if (!el('#refundCID').value) {
        el('#refundTry').appendChild(yo`<div class="alert alert-info">
          It looks like you didn't contribute to this campaign.
          No contribution ID's have been found.
        </div>`);
        return;
      }

      el('#account-claim-refund-response').style.display = 'block';
      el('#account-claim-refund-response').innerHTML = '';
      el('#account-claim-refund-response').appendChild(yo`<span>
        <h3 style="margin-top: 0px;">Refund Processing</h3>
        <p>Awaiting transaction approval...</p>
      </span>`);

      campaignInstance.claimRefundOwed(contributionID, Object.assign({}, txObject(), {
        from: getDefaultAccount(),
      }), (txError, txHash) => {
        if (txError) {
          el('#account-claim-refund-response').style.display = 'block';
          el('#account-claim-refund-response').innerHTML = '';
          el('#account-claim-refund-response').appendChild(yo`<span>
            <h3 style="margin-top: 0px;">Refund Transaction Error</h3>
            <p>There was an error while sending your transaction..</p>
            <hr />
            <p>${String(txError)}</p>
          </span>`);
        }

        if (txHash) {
          el('#account-claim-refund-response').style.display = 'block';
          el('#account-claim-refund-response').innerHTML = '';
          el('#account-claim-refund-response').appendChild(yo`<span>
            <h3 style="margin-top: 0px;">Refund Processing</h3>
            <p>Your transaction is being processed...</p>
            <hr />
            <label>Transaction Hash</label>
            <h4>
              <a href=${etherScanTxHashUrl(txHash, getNetwork())}
                target="_blank"
                style="color: #FFF;">
                ${txHash}
              </a>
            </h4>
          </span>`);

          getTransactionSuccess(txHash, (txSuccessError, txReceipt) => {
            if (txSuccessError) {
              el('#account-claim-refund-response').style.display = 'block';
              el('#account-claim-refund-response').innerHTML = '';
              el('#account-claim-refund-response').appendChild(yo`<span>
                <h3 style="margin-top: 0px;">Transaction Error</h3>
                <p>There was an error while sending your transaction..</p>
                <hr />
                <p>${String(txSuccessError)}</p>
                <p>
                  view it on etherscan:
                  <a href=${etherScanTxHashUrl(txHash, getNetwork())}
                    target="_blank"
                    style="color: #FFF;">
                    ${txHash}
                  </a>
                </p>
              </span>`);
            }

            if (txReceipt) {
              el('#account-claim-refund-response').style.display = 'block';
              el('#account-claim-refund-response').innerHTML = '';
              el('#account-claim-refund-response').appendChild(yo`<span>
                <h3 style="margin-top: 0px;">Refund Transaction Success!</h3>
                <p>Your transaction was successfully sent.
                Continue to payout your balance now by clicking 'Payout Balance'.</p>
                <hr />
                view it on etherscan:
                <a href=${etherScanTxHashUrl(txHash, getNetwork())}
                  target="_blank"
                  style="color: #FFF;">
                  ${txHash}
                </a>
              </span>`);
            }
          });
        }
      });
    });

    // send ether functionality
    el('#sendEther').addEventListener('click', () => {
      const etherAmount = (new BigNumber(web3.toWei(el('#sendAmount').value, 'ether'))).toFixed(0);
      const destination = el('#sendAddress').value;

      el('#account-send-tx-response').style.display = 'block';
      el('#account-send-tx-response').innerHTML = '';
      el('#account-send-tx-response').appendChild(yo`<span>
        <h3 style="margin-top: 0px;">Transaction Processing</h3>
        <p>Awaiting transaction approval...</p>
      </span>`);

      if ((new BigNumber(etherAmount)).lt(0)) {
        el('#account-send-tx-response').style.display = 'block';
        el('#account-send-tx-response').innerHTML = '';
        el('#account-send-tx-response').appendChild(yo`<span>
          <h3 style="margin-top: 0px;">Transaction Error</h3>
          <p>There was an error while sending your transaction..</p>
          <hr />
          <p>Your transaction value cannot be less than zero.</p>
        </span>`);
        return;
      }

      if (!web3.isAddress(destination)) {
        el('#account-send-tx-response').style.display = 'block';
        el('#account-send-tx-response').innerHTML = '';
        el('#account-send-tx-response').appendChild(yo`<span>
          <h3 style="margin-top: 0px;">Transaction Error</h3>
          <p>There was an error while sending your transaction..</p>
          <hr />
          <p>Your transaction destination address is invalid.</p>
        </span>`);
        return;
      }

      web3.eth.sendTransaction(Object.assign({}, txObject(), {
        from: getDefaultAccount(),
        to: destination,
        value: etherAmount,
      }), (txError, txHash) => {
        if (txError) {
          el('#account-send-tx-response').style.display = 'block';
          el('#account-send-tx-response').innerHTML = '';
          el('#account-send-tx-response').appendChild(yo`<span>
            <h3 style="margin-top: 0px;">Transaction Error</h3>
            <p>There was an error while sending your transaction..</p>
            <hr />
            <p>${String(txError)}</p>
          </span>`);
        }

        if (txHash) {
          el('#account-send-tx-response').style.display = 'block';
          el('#account-send-tx-response').innerHTML = '';
          el('#account-send-tx-response').appendChild(yo`<span>
            <h3 style="margin-top: 0px;">Transaction Processing</h3>
            <p>Your transaction is being processed...</p>
            <hr />
            <label>Transaction Hash</label>
            <h4>
              <a href=${etherScanTxHashUrl(txHash, getNetwork())}
                target="_blank"
                style="color: #FFF;">
                ${txHash}
              </a>
            </h4>
          </span>`);

          getTransactionSuccess(txHash, (txSuccessError, txReceipt) => {
            if (txSuccessError) {
              el('#account-send-tx-response').style.display = 'block';
              el('#account-send-tx-response').innerHTML = '';
              el('#account-send-tx-response').appendChild(yo`<span>
                <h3 style="margin-top: 0px;">Transaction Error</h3>
                <p>There was an error while sending your transaction..</p>
                <hr />
                <p>${String(txSuccessError)}</p>
                <p>
                  view it on etherscan:
                  <a href=${etherScanTxHashUrl(txHash, getNetwork())}
                    target="_blank"
                    style="color: #FFF;">
                    ${txHash}
                  </a>
                </p>
              </span>`);
            }

            if (txReceipt) {
              el('#account-send-tx-response').style.display = 'block';
              el('#account-send-tx-response').innerHTML = '';
              el('#account-send-tx-response').appendChild(yo`<span>
                <h3 style="margin-top: 0px;">Transaction Success!</h3>
                <p>Your transaction was successfully sent.</p>
                <hr />
                view it on etherscan:
                <a href=${etherScanTxHashUrl(txHash, getNetwork())}
                  target="_blank"
                  style="color: #FFF;">
                  ${txHash}
                </a>
              </span>`);
            }
          });
        }
      });
    });

    // load token at this address
    el('#tokens-loading').innerHTML = '<h3>Loading token data...</h3>';
    el('#tokens').innerHTML = '';
    loadTokenFromEnhancer('0x725cfbffab60e77b8ea38c870c75b78efed50a51', contracts);
    loadTokenFromEnhancer('0xb1d393bbf102e60b62f53de35a9a107d9cb06b74', contracts);
    loadTokenFromEnhancer('0x8ce41825df7a3bede52c183dbe23bbe6e05e138d', contracts);
    loadTokenFromEnhancer('0x838cdb6596c3310066763e90c7418304053e77b2', contracts);


    // 0x467ef6ac8f3689d35b0fcfcbfa09a9ab498d7020

    // refresh page buttons
    refreshPageButtons();
  });
}

function clearSensitiveFields() {
  el('#account-wallet-seed').value = '';
  el('#account-wallet-passphrase').value = '';
  el('#account-wallet-passphrase-retype').value = '';
  el('#account-wallet-alert').style.diplay = 'none';
}

// load wallet
function loadWallet() {
  // handle wallet seed
  const walletSeed = el('#account-wallet-seed').value;
  const walletFile = el('#account-wallet-file').files[0];
  const walletPassphrase = el('#account-wallet-passphrase').value;

  // clear sensitive data
  clearSensitiveFields();

  if (walletFile) {
    const reader = new FileReader();
    const filePromise = new Promise(resolve => {
      reader.onload = (loadEvent) => {
        resolve(loadEvent.target.result);
      }
    });
    reader.readAsText(walletFile);
    filePromise
      .then(lightwallet.keystore.deserialize)
      .then(keystore => {
        setKeystore(keystore);
        setWalletProvider(keystore);
        loadAccount();
      })
      .catch(error => {
        el('#view-focus').style.display = 'none';
        el('#view-account').style.display = 'block';
        el('#account-wallet-encrypt-buttons').style.display = 'block';
        el('#account-wallet-alert').style.display = 'block';
        el('#account-wallet-alert').innerHTML = '';
        el('#account-wallet-alert').appendChild(yo`<span>
          <h3 style="margin-top: 0px;">Wallet Error</h3>
          <p>${String(error)}</p>
        </span>`);
      });
  } else if (walletSeed) {
    createEncryptedKeystore(walletSeed, walletPassphrase)
      .then((keystore) => {
        setKeystore(keystore);
        setWalletProvider(keystore);
        loadAccount();
      })
      .catch(error => {
        el('#view-focus').style.display = 'none';
        el('#view-account').style.display = 'block';
        el('#account-wallet-alert').style.display = 'block';
        el('#account-wallet-alert').innerHTML = '';
        el('#account-wallet-alert').appendChild(yo`<span>
          <h3 style="margin-top: 0px;">Wallet Error</h3>
          <p>${String(error)}</p>
        </span>`);
      });
  } else {
    el('#view-focus').style.display = 'none';
    el('#view-account').style.display = 'block';
    el('#account-wallet-alert').innerHTML = '';
    el('#account-wallet-alert').appendChild(yo`<p>
      <h3 style="margin-top: 0px;">Wallet Error</h3>
      You must enter a seed or upload your encrypted wallet file.
    </p>`);
  }
}

// draw account page
export default function loadAndDrawAccount(callback) {
  // draw loader
  el('#view-focus').innerHTML = '';
  el('#view-focus').appendChild(viewLoader({ t }));

  el('#view-account').innerHTML = '';
  el('#view-account').appendChild(accountView({}));

  el('#account-wallet-metamask').innerHTML = 'METAMASK';

  el('#account-wallet-metamask').addEventListener('click', () => {
    el('#account-wallet-metamask').innerHTML = 'LOADING METAMASK...';
    setMetamaskProvider()
    .then(() => {
      el('#account-wallet-metamask').innerHTML = 'METAMASK';
      loadAccount();
    })
    .catch((err) => {
      el('#account-wallet-metamask').innerHTML = 'METAMASK';
      el('#account-wallet-alert').innerHTML = '';
      el('#account-wallet-alert').appendChild(yo`<p>
        <h3 style="margin-top: 0px;">MetaMask Error</h3>
        There was an error while using attempting to use MetaMask:
        <hr />
        ${err}
      </p>`);
    });
  });

  el('#account-wallet-file').addEventListener('change', () => {
    el('#view-focus').style.display = 'block';
    el('#view-account').style.display = 'none';
    loadWallet();
  });
  el('#account-wallet-encrypt').addEventListener('click', () => {
    loadWallet();
  });
  el('#account-wallet-passphrase-retype').addEventListener('keydown', (e) => {
    if (e.keyCode == 13) {
      el('#view-focus').style.display = 'block';
      el('#view-account').style.display = 'none';
      loadWallet();
    }
  });
  el('#account-wallet-restore').addEventListener('click', () => {
    if (el('#account-wallet-seed').value === '') {
      el('#account-wallet-alert').style.display = 'block';
      el('#account-wallet-alert').innerHTML = '';
      el('#account-wallet-alert').appendChild(yo`<p>
        <h3 style="margin-top: 0px;">Wallet Error</h3>
        You must enter a seed or upload your encrypted wallet file.
      </p>`);
      return;
    } else {
      el('#account-wallet-alert').style.display = 'none';
    }

    el('#account-wallet-buttons').style.display = 'none';
    el('#account-wallet-encrypt').style.display = 'inline-block';
    el('#account-wallet-seed').style.display = 'none';
    el('#account-wallet-passphrase').style.display = 'inline-block';
    el('#account-wallet-passphrase-retype').style.display = 'inline-block';
    el('#account-wallet-encrypt-buttons').style.display = 'inline-block';
  });
  el('#account-wallet-upload').addEventListener('click', () => {
    el('#account-wallet-file').click();
  });

  callback(null, true);

  // if hooked web3 provider just login
  if (web3.currentProvider.currentBlock) {
    loadAccount();
  }

  // if provider is metamask
  if (web3.currentProvider.isMetaMask) {
    loadAccount();
  }
}
