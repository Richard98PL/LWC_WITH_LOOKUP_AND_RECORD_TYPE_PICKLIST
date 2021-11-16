import { LightningElement, api, track } from 'lwc';
import search from '@salesforce/apex/LeadFromContactController.search';
const DELAY = 300;
export default class SearchComponent extends LightningElement {

    @api objName;
    @api iconName;
    @api labelName;
    @api readOnly = false;
    @api placeholder;
    @api fields;

    @track error;
    delayTimeout;
    searchRecords;
    selectedRecord;
    isLoading = false;

    ICON_URL = '/apexpages/slds/latest/assets/icons/{0}-sprite/svg/symbols.svg#{1}';

    connectedCallback(){
        let icons           = this.iconName.split(':');
        this.ICON_URL       = this.ICON_URL.replace('{0}',icons[0]);
        this.ICON_URL       = this.ICON_URL.replace('{1}',icons[1]);

        let combinedFields = [];
        combinedFields.push(this.name, this.recordTypeName);

        this.fields = combinedFields.concat( JSON.parse(JSON.stringify(this.fields)) );
    }

    handleInputChange(event){
        window.clearTimeout(this.delayTimeout);
        const searchKey = event.target.value;
        this.delayTimeout = setTimeout(() => {
                search({
                    searchTerm : searchKey,
                    objName : this.objName
                })
                    .then(result => {
                        let stringResult = JSON.stringify(result);
                        let allResult    = JSON.parse(stringResult);
                        this.searchRecords = allResult;
                        allResult.forEach( record => {
                            record.name = record['Name'];
                            if(record['RecordType']['Name']){
                                record.recordTypeName = record['RecordType']['Name'];
                            }
                        });
                        this.searchRecords = allResult;
                    })
                    .catch(error => {
                        console.error('Error:', error);
                    })
                    .finally( ()=>{

                    });
        }, DELAY);
    }

    handleSelect(event){
        let recordId = event.currentTarget.dataset.recordId;
        let selectRecord = this.searchRecords.find((item) => {
            return item.Id === recordId;
        });
        this.selectedRecord = selectRecord;

        let lookupEvent = new CustomEvent('lookup', {
            detail: {id: recordId, objName: this.objName}
        });
        this.dispatchEvent(lookupEvent);
    }

    handleClose(){
        this.selectedRecord = undefined;
        this.searchRecords  = undefined;
        let lookupEvent = new CustomEvent('lookup', {
            detail: {id: null, objName: this.objName}
        });
        this.dispatchEvent(lookupEvent);
    }
}