<?php

namespace Database\Seeders;

use App\Models\DisclosureTemplate;
use Illuminate\Database\Seeder;

/**
 * Starter disclosure templates. The wording is a PLACEHOLDER structure only and must be
 * replaced with legally approved text for each version before launch.
 */
class DisclosureTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'key' => 'broker_credit_guide',
                'title' => 'Broker credit guide',
                'summary' => 'Who your broker is, how they are paid, and how to complain. Read this before we give you credit assistance.',
                'body' => "Credit guide\n\nPrepared for {{borrower_name}} on {{date}}.\n\nAbout us\nCredit assistance is provided by {{licensee_name}}, {{licence_number}}, through its authorised credit representatives.\n\nWhat we do\nWe help you find a {{loan_type}} that is not unsuitable for your needs and objectives. MEGA software shortlists lenders whose published policies fit your situation; a licensed broker reviews that shortlist and is responsible for any recommendation.\n\nHow we are paid\nLenders may pay us commission when a loan settles. We will tell you the amount, or how it is calculated, before you apply. Commission does not change how lenders are ranked for you.\n\nComplaints\nContact us first. If you are not satisfied, you can contact the Australian Financial Complaints Authority (AFCA), a free and independent service.\n\n[Template wording to be approved by legal before use.]",
                'position' => 1,
            ],
            [
                'key' => 'privacy_collection',
                'title' => 'Privacy collection notice and consent',
                'summary' => 'What personal information we collect, why, who we share it with, and your rights to access and correct it.',
                'body' => "Privacy collection notice\n\n{{borrower_name}} ({{borrower_email}})\n\nWe collect your personal information, including identity, financial and credit information, to assess your {{loan_type}} application for {{loan_amount}} and to provide credit assistance.\n\nAutomated processing\nSoftware reads your documents and compares your situation with lender policies. It does not make credit decisions. A licensed broker reviews every recommendation, and lenders make the final decision.\n\nWho we share it with\nYour broker, the lender you choose ({{lender_name}}), identity and credit reporting bodies, and service providers who host data in Australia.\n\nYour rights\nYou can access and correct your information, withdraw optional consents, and request deletion from your privacy centre at any time.\n\n[Template wording to be approved by legal before use.]",
                'position' => 2,
            ],
            [
                'key' => 'credit_information_authority',
                'title' => 'Authority to obtain credit information',
                'summary' => 'Lets us and your chosen lender obtain your credit report for this application.',
                'body' => "Authority to obtain credit information\n\nI, {{borrower_name}}, authorise {{licensee_name}} and {{lender_name}} to obtain credit reporting information about me from a credit reporting body for the purpose of assessing my application for a {{loan_type}} of {{loan_amount}}.\n\nI understand a lender's credit enquiry may be recorded on my credit file.\n\nSigned electronically on {{date}}.\n\n[Template wording to be approved by legal before use.]",
                'position' => 3,
            ],
            [
                'key' => 'lender_key_terms',
                'title' => 'Lender credit guide and key terms acknowledgement',
                'summary' => 'Confirms you have seen the indicative terms for your chosen option. Indicative only, not an offer of credit.',
                'body' => "Lender key terms acknowledgement\n\nOption chosen: {{lender_name}}\nLoan type: {{loan_type}}\nAmount: {{loan_amount}}\n\nThe rates, fees and policy summaries shown by MEGA are indicative, based on the lender's published policy and rate sheet at the time of assessment. They are not an offer or approval of credit. The lender will provide its own credit guide, contract and key facts sheet before you sign any loan contract.\n\nAcknowledged by {{borrower_name}} on {{date}}.\n\n[Template wording to be approved by legal before use.]",
                'position' => 4,
            ],
        ];

        foreach ($templates as $template) {
            DisclosureTemplate::create([...$template, 'version' => 1, 'approved_at' => now()]);
        }
    }
}
