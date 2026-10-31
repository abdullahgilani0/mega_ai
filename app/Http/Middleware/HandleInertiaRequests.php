<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user,
                'role' => $user?->role->value,
                'roleLabel' => $user?->role->label(),
                'permissions' => $user?->permissionNames() ?? [],
                'avatar' => $user?->avatarIndex(),
            ],
            'notifications' => fn () => $user ? [
                'unread' => $user->unreadNotifications()->count(),
                'items' => $user->notifications()->latest()->limit(8)->get()->map(fn (DatabaseNotification $notification) => [
                    'id' => $notification->id,
                    'title' => $notification->data['title'] ?? 'Update',
                    'body' => $notification->data['body'] ?? '',
                    'read' => $notification->read_at !== null,
                    'at' => $notification->created_at?->toIso8601String(),
                ]),
            ] : null,
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
