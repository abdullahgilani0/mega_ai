<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use App\Services\PlatformSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function index(PlatformSettings $settings): Response
    {
        return Inertia::render('admin/settings', [
            'settings' => collect(PlatformSettings::DEFINITIONS)->map(fn (array $definition, string $key) => [
                'key' => $key,
                'label' => $definition[0],
                'type' => $definition[1],
                'help' => $definition[2],
                'value' => $settings->get($key),
            ])->values(),
        ]);
    }

    public function update(Request $request, PlatformSettings $settings, AuditLogger $audit): RedirectResponse
    {
        $validated = $request->validate([
            'key' => ['required', 'string', 'in:'.implode(',', array_keys(PlatformSettings::DEFINITIONS))],
            'value' => ['present'],
        ]);

        $key = $validated['key'];
        $type = PlatformSettings::DEFINITIONS[$key][1];
        $value = match ($type) {
            'int' => $this->integer($validated['value']),
            'bool' => filter_var($validated['value'], FILTER_VALIDATE_BOOLEAN),
            'weights' => $this->weights($validated['value']),
        };

        $before = $settings->get($key);
        $settings->set($key, $value, $request->user()->id);
        $audit->record('settings.updated', null, ['key' => $key, 'value' => $before], ['key' => $key, 'value' => $value]);

        Inertia::flash('toast', ['type' => 'success', 'message' => PlatformSettings::DEFINITIONS[$key][0].' saved.']);

        return back();
    }

    private function integer(mixed $value): int
    {
        if (! is_numeric($value) || (int) $value < 0 || (int) $value > 100000) {
            throw ValidationException::withMessages(['value' => 'Enter a whole number.']);
        }

        return (int) $value;
    }

    /**
     * @return array<string, float>
     */
    private function weights(mixed $value): array
    {
        if (! is_array($value) || $value === []) {
            throw ValidationException::withMessages(['value' => 'Weights are required.']);
        }

        $weights = array_map(fn ($weight) => round((float) $weight, 3), $value);

        if (abs(array_sum($weights) - 1) > 0.001) {
            throw ValidationException::withMessages(['value' => 'Weights must add up to 1.']);
        }

        return $weights;
    }
}
