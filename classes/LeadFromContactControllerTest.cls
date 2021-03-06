@isTest
public with sharing class LeadFromContactControllerTest {
    private final static String TEST_STRING = 'Test';
    private final static String TEST_EMAIL = 'test@gmail.com';

    @TestSetup
    public static void setup(){
        Account account = new Account();
        account.Name = TEST_STRING;
        insert account;

        List<sObject> sObjects = new List<SObject>();
        Contact contact = new Contact();
        contact.FirstName = TEST_STRING;
        contact.LastName = TEST_STRING;
        contact.Email = TEST_EMAIL;
        contact.AccountId = account.Id;
        contact.MobilePhone = TEST_STRING;
        sObjects.add(contact);

        Campaign campaign = new Campaign();
        campaign.Name = TEST_STRING;
        sObjects.add(campaign);

        insert sObjects;
    }

    @IsTest
    public static void searchTest(){
        String campaignName = TEST_STRING;
        String campaignSObjectName = 'Campaign';
        System.assert(
                !LeadFromContactController.search(campaignName, campaignSObjectName).isEmpty()
        );
    }

    @IsTest
    public static void createLeadTest(){
        Contact contact = [SELECT Id,
                FirstName,
                LastName,
                Email,
                AccountId,
                MobilePhone
        FROM Contact WHERE Email = :TEST_EMAIL];

        Campaign campaign = [SELECT Id FROM Campaign WHERE Name = :TEST_STRING];
        List<RecordType> leadRecordTypes = [select Id from RecordType WHERE sObjectType = 'Lead'];
        LeadFromContactController.createLeadAndCampaignMember(contact.Id, campaign.Id, leadRecordTypes[0].Id);
        Lead lead = [SELECT Id, Contact__c, RecordTypeId FROM Lead];
        System.assert(lead != null);
        System.assert(lead.Contact__c != null);
        System.assert(lead.Contact__c == contact.Id);
        System.assert(lead.RecordTypeId == leadRecordTypes[0].Id);
    }
}