<?php

namespace App\Http\Controllers\Journey;

use App\Enums\ApplicationStage;
use App\Enums\DocumentKind;
use App\Enums\LoanPack;
use App\Http\Controllers\Controller;
use App\Http\Resources\DocumentResource;
use App\Models\Application;
use App\Services\ApplicationTimeline;
use App\Services\AuditLogger;
use App\Services\Documents\DocumentIntake;
use App\Services\Vendors\Contracts\OpenBankingProvider;
use App\Support\JourneyPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DocumentController extends Controller
{
    public function index(Application $application): Response
    {
        JourneyController::guard($application, ApplicationStage::Documents);

        $kinds = array_filter(DocumentKind::cases(), fn (DocumentKind $kind) => ! $kind->isIdentity());

        return Inertia::render('journey/documents', [
            'application' => JourneyPresenter::summary($application),
            'documents' => DocumentResource::collection($application->documents()->latest('id')->get())->resolve(),
            'kinds' => array_values(array_map(fn (DocumentKind $kind) => ['value' => $kind->value, 'label' => $kind->label()], $kinds)),
            'suggested' => $this->suggestedKinds($application),
            'bank' => ($application->provenance['bank_institution'] ?? null) === 'open_banking' ? [
                'institution' => $application->fact('bank_institution'),
                'incomeAnnual' => $application->fact('income_annual'),
                'expensesMonthly' => $application->fact('expenses_monthly'),
                'liabilitiesMonthly' => $application->fact('liabilities_monthly'),
            ] : null,
            'creditCheckComplete' => $application->creditReport()->exists(),
        ]);
    }

    public function store(Request $request, Application $application, DocumentIntake $intake): RedirectResponse
    {
        JourneyController::guard($application, ApplicationStage::Documents);

        $validated = $request->validate([
            'kind' => ['required', Rule::enum(DocumentKind::class)],
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,webp,heic', 'max:15360'],
        ]);

        $document = $intake->store($application, $request->file('file'), DocumentKind::from($validated['kind']));

        Inertia::flash('toast', $document->attention_reason
            ? ['type' => 'warning', 'message' => $document->attention_reason]
            : ['type' => 'success', 'message' => $document->kind->label().' received.']);

        return back();
    }

    /**
     * Open banking first: derived income, expenses and debts replace statement uploads.
     */
    public function connectBank(Application $application, OpenBankingProvider $bank, ApplicationTimeline $timeline, AuditLogger $audit): RedirectResponse
    {
        JourneyController::guard($application, ApplicationStage::Documents);

        $financials = $bank->fetchFinancials($application);

        foreach (['income_annual', 'expenses_monthly', 'liabilities_monthly', 'savings_balance'] as $field) {
            $application->setFact($field, $financials[$field], 'open_banking');
        }
        $application->setFact('bank_institution', $financials['institution'], 'open_banking');
        $application->save();

        $timeline->record($application, 'bank.connected', ['institution' => $financials['institution'], 'months' => $financials['months_analysed']]);
        $audit->record('bank.connected', $application, after: ['provider' => $bank->name(), 'months_analysed' => $financials['months_analysed']]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Bank connected. '.$financials['months_analysed'].' months analysed.']);

        return back();
    }

    public function continue(Application $application): RedirectResponse
    {
        JourneyController::guard($application, ApplicationStage::Documents);

        $application->advanceTo(ApplicationStage::Advisor);

        return to_route('journey.advisor', $application);
    }

    /**
     * @return list<string>
     */
    private function suggestedKinds(Application $application): array
    {
        $kinds = [DocumentKind::Payslip, DocumentKind::BankStatement];

        if ($application->loan_pack === LoanPack::Business || $application->employment_type === 'self_employed') {
            $kinds = [DocumentKind::TaxReturn, DocumentKind::Bas, DocumentKind::BankStatement];
        }

        if ($application->loan_pack === LoanPack::Home && $application->purpose !== 'refinance') {
            $kinds[] = DocumentKind::ContractOfSale;
        }

        return array_map(fn (DocumentKind $kind) => $kind->value, $kinds);
    }
}
