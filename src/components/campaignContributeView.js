import yo from 'yo-yo';
import { etherScanAddressUrl, etherScanTxHashUrl, oneDay, emptyWeb3Address } from 'weifund-util';

import campaignContributeReceipt from './campaignContributeReceipt';
import campaignContributeForm from './campaignContributeForm';
import campaignContributeReview from './campaignContributeReview';
import campaignContributeNav from './campaignContributeNav';
import campaignContributeWallet from './campaignContributeWallet';
import campaignContributeVerify from './campaignContributeVerify';
import { nameOf, getNetwork } from '../environment';

// main export
export default function campaignContributeView(options) {
  const campaignObject = options.campaignObject;
  const t = options.t;

  return yo`<div id="campaign-contribute" style="margin-top: 40px; margin-bottom: 150px;">

  <input type="hidden" value="${campaignObject.id}" id="campaign_id" />

  <div class="row center-block container text-center" style="margin-bottom: 30px;">
    <a href="/campaign/${campaignObject.id}/" target="_blank"
      style="color: #FFF; text-decoration: none;">
      <h1 class="text-pretty-huge">Braid Campaign</h1>
    </a>
    <h4>
      ${t('campaignFocusView.by')}
      <a href=${etherScanAddressUrl(campaignObject.owner, getNetwork())}
        style="color: #FFF;"
        target="_blank">
        Braid Team
      </a>
    </h4>

    <form class="container-fluid center-block">
      <div class="row bs-wizard center-block" style="border-bottom:0; margin: 0px auto; text-center">
          <div class="col-xs-1 disabled"></div>
          <div id="contributeStep0" class="col-xs-2 bs-wizard-step disabled">
            <h3 class="text-center bs-wizard-stepnum">
              Wallet <span class="hidden-sm hidden-xs hidden-md">Generation</span>
            </h3>
            <div class="progress" style="width: 50%; margin-left: 50%;">
                <div class="progress-bar"></div>
            </div> <a href="#" class="bs-wizard-dot"></a>
          </div>
          <div id="contributeStep1" class="col-xs-2 bs-wizard-step disabled">
            <h3 class="text-center bs-wizard-stepnum">
              Verify
            </h3>
            <div class="progress">
                <div class="progress-bar"></div>
            </div> <a href="#" class="bs-wizard-dot"></a>
          </div>
          <div id="contributeStep2" class="col-xs-2 bs-wizard-step disabled">
            <h3 class="text-center bs-wizard-stepnum">
              Contribution
            </h3>
            <div class="progress">
                <div class="progress-bar"></div>
            </div> <a href="#" class="bs-wizard-dot"></a>
          </div>
          <div id="contributeStep3" class="col-xs-2 bs-wizard-step disabled">
            <h3 class="text-center bs-wizard-stepnum">
              Review
            </h3>
            <div class="progress">
                <div class="progress-bar"></div>
            </div> <a href="#" class="bs-wizard-dot"></a>
          </div>
          <div id="contributeStep4" class="col-xs-2 bs-wizard-step disabled">
            <h3 class="text-center bs-wizard-stepnum">
              Receipt
            </h3>
            <div class="progress">
                <div class="progress-bar"></div>
            </div> <a href="#" class="bs-wizard-dot"></a>
          </div>
      </div>
    </form>
  </div>

  ${campaignContributeWallet({
    campaignObject: options.campaignObject,
    t,
    getLocale: options.getLocale,
  })}

  ${campaignContributeForm({
    campaignObject: options.campaignObject,
    t,
    getLocale: options.getLocale,
    defaultAccount: options.defaultAccount,
    web3: options.web3,
  })}

  ${campaignContributeVerify({
    campaignObject: options.campaignObject,
    t,
    getLocale: options.getLocale,
    defaultAccount: options.defaultAccount,
    web3: options.web3,
  })}

  ${campaignContributeReview({
    campaignObject: options.campaignObject,
    t,
    getNetwork: options.getNetwork,
    getLocale: options.getLocale,
    defaultAccount: options.defaultAccount,
    web3: options.web3,
  })}

  <div id="view-campaign-contribute-receipt"></div>
</div>`;
}
