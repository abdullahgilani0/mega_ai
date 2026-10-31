<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Territory;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TerritoryController extends Controller
{
    public const STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

    public function index(): Response
    {
        return Inertia::render('admin/territories', [
            'territories' => Territory::withCount('brokers')->orderBy('state')->orderBy('name')->get()->map(fn (Territory $territory) => [
                'id' => $territory->id,
                'name' => $territory->name,
                'state' => $territory->state,
                'postcodes' => self::compress($territory->postcodes),
                'postcodeCount' => count($territory->postcodes),
                'brokers' => $territory->brokers_count,
            ]),
            'states' => self::STATES,
        ]);
    }

    public function store(Request $request, AuditLogger $audit): RedirectResponse
    {
        $territory = Territory::create($this->validated($request));
        $audit->record('territory.created', $territory);

        return back();
    }

    public function update(Request $request, Territory $territory, AuditLogger $audit): RedirectResponse
    {
        $before = ['postcodes' => count($territory->postcodes), 'name' => $territory->name];
        $territory->update($this->validated($request, $territory));
        $audit->record('territory.updated', $territory, $before, ['postcodes' => count($territory->postcodes), 'name' => $territory->name]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Territory saved.']);

        return back();
    }

    public function destroy(Territory $territory, AuditLogger $audit): RedirectResponse
    {
        if ($territory->brokers()->exists()) {
            throw ValidationException::withMessages(['territory' => 'Move its brokers to another territory first.']);
        }

        $audit->record('territory.deleted', $territory, before: ['name' => $territory->name]);
        $territory->delete();

        return back();
    }

    /**
     * @return array{name: string, state: string, postcodes: list<string>}
     */
    private function validated(Request $request, ?Territory $territory = null): array
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120', Rule::unique('territories', 'name')->ignore($territory?->id)],
            'state' => ['required', Rule::in(self::STATES)],
            'postcodes' => ['required', 'string', 'max:5000'],
        ]);

        return ['name' => $validated['name'], 'state' => $validated['state'], 'postcodes' => self::expand($validated['postcodes'])];
    }

    /**
     * Parses "2000-2050, 2150, 2760-2770" into a sorted postcode list.
     *
     * @return list<string>
     */
    public static function expand(string $input): array
    {
        $postcodes = [];

        foreach (preg_split('/[\s,;]+/', trim($input)) ?: [] as $part) {
            if (preg_match('/^(\d{3,4})-(\d{3,4})$/', $part, $m) && (int) $m[1] <= (int) $m[2] && (int) $m[2] - (int) $m[1] <= 2000) {
                foreach (range((int) $m[1], (int) $m[2]) as $code) {
                    $postcodes[] = str_pad((string) $code, 4, '0', STR_PAD_LEFT);
                }
            } elseif (preg_match('/^\d{3,4}$/', $part)) {
                $postcodes[] = str_pad($part, 4, '0', STR_PAD_LEFT);
            } elseif ($part !== '') {
                throw ValidationException::withMessages(['postcodes' => "“{$part}” is not a postcode or range."]);
            }
        }

        $postcodes = array_values(array_unique($postcodes));
        sort($postcodes);

        if ($postcodes === []) {
            throw ValidationException::withMessages(['postcodes' => 'Add at least one postcode.']);
        }

        return $postcodes;
    }

    /**
     * Turns a postcode list back into compact ranges for editing.
     *
     * @param  list<string>  $postcodes
     */
    public static function compress(array $postcodes): string
    {
        $codes = array_map('intval', $postcodes);
        sort($codes);
        $ranges = [];
        $start = $prev = null;

        foreach ([...$codes, null] as $code) {
            if ($start !== null && $code !== $prev + 1) {
                $ranges[] = $start === $prev
                    ? str_pad((string) $start, 4, '0', STR_PAD_LEFT)
                    : str_pad((string) $start, 4, '0', STR_PAD_LEFT).'-'.str_pad((string) $prev, 4, '0', STR_PAD_LEFT);
                $start = null;
            }

            if ($code !== null) {
                $start ??= $code;
                $prev = $code;
            }
        }

        return implode(', ', $ranges);
    }
}
