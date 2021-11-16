public with sharing class LeadFromContactController {
    private static Boolean validateId(String id) {
        return ((id.length() == 15 || id.length() == 18) && Pattern.matches('^[a-zA-Z0-9]*$', id));
    }

    @AuraEnabled
    public static List<sObject> search(String searchTerm, String objName){
        String query = 'SELECT Id,Name,RecordType.Name FROM ' + objName + ' WHERE (';
        query += 'Name LIKE \'' + searchTerm + '%\'';
        if(validateId(searchTerm)) {
            query += ' OR Id = \'' + searchTerm + '\'';
        }
        query += ' ) AND RecordTypeId != null LIMIT 20';
        return Database.query(query);
    }


    @AuraEnabled
    public static String createLeadAndCampaignMember(Id contactId, Id campaignId, Id leadRecordTypeId){
        Map<String,String> contactToLeadFields = new Map<String,String>();
        for(Lead_From_Contact_Configuration__mdt metadata: Lead_From_Contact_Configuration__mdt.getAll().values()) {
            contactToLeadFields.put(
                    String.valueOf(metadata.Contact_Field__c).toLowerCase(),
                    String.valueOf(metadata.Lead_Field__c).toLowerCase()
            );
        }

        Set<String> contactFields = new Set<String>();
        contactFields.addAll(contactToLeadFields.keySet());
        contactFields.add('id');

        String query = 'SELECT';
        for(String contactField: contactFields){
            query += ' ' + contactField + ',';
        }
        query = query.removeEnd(',');
        query += ' FROM Contact WHERE Id = \'' + contactId + '\'';

        Contact contact = Database.query(query);

        List<CampaignMember> existingCampaignMemberCheck = [
                SELECT Id FROM CampaignMember WHERE ContactId = :contactId AND CampaignId = :campaignId];

        if(existingCampaignMemberCheck.isEmpty()){
            CampaignMember campaignMember = new CampaignMember();
            campaignMember.contactId = contactId;
            campaignMember.campaignId = campaignId;
            insert campaignMember;

            Lead lead = new Lead();
            for(String contactField : contactToLeadFields.keySet()){
                String leadFieldValue;
                if(!contactField.contains('.')){
                    leadFieldValue = String.valueOf(contact.get(contactField));
                }else{
                    List<String> splitField = contactField.split('\\.');
                    leadFieldValue = String.valueOf(contact.getSObject(splitField[0]).get(splitField[1]));
                }

                if(leadFieldValue == 'true' || leadFieldValue == 'false'){
                    lead.put(contactToLeadFields.get(contactField), Boolean.valueOf(leadFieldValue));
                }else{
                    lead.put(contactToLeadFields.get(contactField), leadFieldValue);
                }
            }
            lead.RecordTypeId = leadRecordTypeId;
            insert lead;
            return lead.Id;
        }else{
            return null;
        }
    }
}