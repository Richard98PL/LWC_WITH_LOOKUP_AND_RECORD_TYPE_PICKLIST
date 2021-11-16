import {LightningElement, api, wire, track} from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import LEAD_OBJECT from '@salesforce/schema/Lead';
import createLeadAndCampaignMember from '@salesforce/apex/LeadFromContactController.createLeadAndCampaignMember';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { CloseActionScreenEvent } from 'lightning/actions';
import {NavigationMixin} from "lightning/navigation";
import successMessage from '@salesforce/label/c.leadFromContactPardotSuccess';
import warningMessage from '@salesforce/label/c.leadFromContactPardotWarning';
import errorMessage from '@salesforce/label/c.leadFromContactPardotError';
import synchronizationMessage from '@salesforce/label/c.leadFromContactPardotSynchronizationMessage';
import cardTitle from '@salesforce/label/c.leadFromContactPardotTitle';
import button from '@salesforce/label/c.leadFromContactPardotButton';
import {getRecord, getFieldValue} from 'lightning/uiRecordApi';
import isPardotSynchronized from '@salesforce/schema/Contact.Is_Pardot_Synchronized__c'

export default class LeadFromContactPardot extends NavigationMixin(LightningElement) {
    labels = {
        synchronizationMessage,
        cardTitle,
        button
    };

    @track campaignId;
    @track leadRecordTypeId;

    disableButton = true;
    campaignFields = ['Name', 'RecordType.Name'];

    @api recordId;
    @api objectApiName;

    @track value;
    @track options;
    map;
    isLoading = false;
    isPardotSynchronized = false;

    @wire(getRecord, { recordId:'$recordId', fields: isPardotSynchronized})
    loadFields({error, data}){
        if(error){
            console.log('error', JSON.parse(JSON.stringify(error)));
        }else if(data){
            this.isPardotSynchronized = getFieldValue(data, isPardotSynchronized);
        }
    }

    @wire(getObjectInfo, { objectApiName: LEAD_OBJECT })
    leadRecordTypesInit({error, data}) {
        if(data) {
            let parsedOptions = JSON.parse(JSON.stringify(data.recordTypeInfos));
            let map = new Map();
            let values = [];
            let comboBoxValues = [];

            for(const [key,value] of Object.entries(parsedOptions)){
                let recordTypeName = value.name;

                if(recordTypeName == 'Master'){
                    continue;
                }

                map.set(recordTypeName, key);
                comboBoxValues.push({
                    value : key,
                    label : recordTypeName,
                    description : ""
                });
            }
            this.map = map;
            this.options = comboBoxValues;
        }
        else if(error) {
            console.log(error);
            this.showToast("Unexpected error. Please contact your Salesforce administrator.", "error");
            this.closeQuickAction();
        }
    }

    handleChange(event) {
        this.leadRecordTypeId = event.target.value;
        this.handleButtonDisabling();
    }

    handleLookup(event){
        this.campaignId = event.detail.id;
        this.handleButtonDisabling();
    }

    handleButtonDisabling(){
        this.disableButton = !(this.leadRecordTypeId && this.campaignId);
    }

    showToast(message, variant) {
        const evt = new ShowToastEvent({
            message: message,
            variant: variant,
        });
        this.dispatchEvent(evt);
    }

    closeQuickAction() {
        this.dispatchEvent(new CloseActionScreenEvent());
    }

    navigateToLead(recordId) {
        this[NavigationMixin.GenerateUrl]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                objectApiName: 'Lead',
                actionName: 'view'
            }
        }).then(url => {
            setTimeout(() => {
                window.open(url, "_blank")
                this.navigateToCampaign(this.campaignId);
            },1000);
        });
    }

    navigateToCampaign(recordId) {
        this[NavigationMixin.GenerateUrl]({
            type: 'standard__recordPage',
            attributes: {
                recordId: recordId,
                objectApiName: 'Campaign',
                actionName: 'view'
            }
        }).then(url => {window.open(url,  "_blank")});
    }

    handleButtonClick(event){
        this.isLoading = true;
        createLeadAndCampaignMember({
            contactId : this.recordId,
            campaignId : this.campaignId,
            leadRecordTypeId : this.leadRecordTypeId
        })
            .then(result => {
                let response = result;
                if(response){
                    this.showToast(successMessage, "success");
                    this.navigateToLead(result);
                }else{
                    this.showToast(warningMessage, "warning");
                }
            })
            .catch(error => {
                console.log(error);
                this.showToast(errorMessage, "error");
            })
            .finally( ()=>{
                this.isLoading = false;
                this.closeQuickAction();
            });
    }
}