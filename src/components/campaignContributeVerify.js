import yo from 'yo-yo';
import BigNumber from 'bignumber.js';
import { etherScanAddressUrl } from 'weifund-util';

import campaignContributeNav from './campaignContributeNav';
import { getNetwork, txObject, defaultAccount } from '../environment';
import { web3 } from '../web3';

export default function campaignContributeVerify(options) {
  const campaignObject = options.campaignObject;
  const defaultAccount = options.defaultAccount;
  const gasPrice = web3.toWei('0.00000002', 'ether');
  const actualGasCost = (new BigNumber(txObject().gas)).times(gasPrice);
  const t = options.t;

  return yo`<div>
  <div id="view-campaign-contribute-verify" class="row center-block container"
    style="margin-top: 80px; margin-bottom: 150px;">
    <div class="col-xs-12 no-border-xs no-border-sm">
      <h3>Verify Account</h3>
      <h4>Please verify your account with our OFAC verification oracle.</h4>
      <br /><br />
      <div class="row">
        <div class="col-xs-6">
          <label>Fist Name</label>
          <input class="form-control" style="color: #333;" type="text" name="firstName" placeholder="Jane"/>

          <br /><br />

          <label>Last Name</label>
          <input class="form-control" style="color: #333;" type="text" name="lastName" placeholder="Doe"/>

          <br /><br />

          <label>Email</label>
          <input class="form-control" style="color: #333;" type="text" name="email" placeholder="jane@gmail.com"/>
        </div>
        <div class="col-xs-6">
          <div style="display: none;">
            <label>Investor Agreement
            <span data-tooltip="A hash is a cryptographic signature of a peice of information. SHA3 is the name of this hashing algorithm.">
              Sha3 Hash
            </span></label>
            <small><br /></small>
            <small class="text-gray">This is the SHA3 cryptographic signature of the investor agreement.</small>
            <p>0xa02e70b89026be3e7626947d312fc6061a95f73e562b5606bfd8c1d10f68f5d1</p>
          </div>

          <div style="padding: 20px; margin-top: 18px; width: 100%; display: inline-block; border: 1px solid #F1F1F1;">
            <input type="checkbox" class="form-contol" id="usa-check">
            <label>I agree that I am not a US citizen.</label>

            <br /><br />

            <input type="checkbox" class="form-contol" id="usa-check">
            <label>I agree to the <a href="">Braid Investor Agreement</a></label>
          </div>

          <br /><br />

          <input type="hidden" name="account" value="${defaultAccount()}" />

          <a href="${`/campaign/${options.campaignObject.id}/contribute/form`}"
            id="campaign-contribute-to-campaign-verify"
            style="margin-top: 18px;"
            class="btn btn-primary" disabled="disabled">
            CONTRIBUTE
          </a>
        </div>

        <div class="alert alert-info" style="display: none;" id="verify-response">
        </div>
      </div>
      <br />
      <br />
    </div>
    ${campaignContributeNav({
      backURL: `/campaign/${options.campaignObject.id}/contribute/`,
      showNextButton: false,
    })}
  </div></div>`;
}
