<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Signature;
use App\Services\AuditLogger;
use App\Services\FileAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Serves borrower files only after an authorisation check, never by public URL,
 * and records every access in the audit log the borrower can see.
 */
class FileController extends Controller
{
    public function document(Request $request, Document $document, FileAccess $access, AuditLogger $audit): StreamedResponse
    {
        abort_unless($access->canRead($request->user(), $document->application), 404);
        abort_if($document->storage_path === '' || ! Storage::disk('local')->exists($document->storage_path), 410, 'This file has been deleted under the retention policy.');

        $audit->record('document.downloaded', $document->application, after: ['document_id' => $document->id], reason: 'File download');

        return Storage::disk('local')->download($document->storage_path, $document->original_name, [
            'Cache-Control' => 'no-store, private',
        ]);
    }

    public function signature(Request $request, Signature $signature, FileAccess $access): Response
    {
        abort_unless($access->canRead($request->user(), $signature->application), 404);

        return Inertia::render('documents/signed', [
            'document' => [
                'title' => $signature->template->title,
                'version' => $signature->template->version,
                'body' => $signature->rendered_body,
                'signedName' => $signature->signed_name,
                'signedAt' => $signature->signed_at->toIso8601String(),
                'acknowledgedAt' => $signature->acknowledged_at->toIso8601String(),
                'hash' => $signature->document_hash,
                'ip' => $signature->ip_address,
                'secondsOnPage' => $signature->seconds_on_page,
                'verified' => hash('sha256', $signature->rendered_body) === $signature->document_hash,
            ],
        ]);
    }
}
