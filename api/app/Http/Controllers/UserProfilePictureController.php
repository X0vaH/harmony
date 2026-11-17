<?php

namespace App\Http\Controllers;

use App\Models\UserProfilePicture;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class UserProfilePictureController extends Controller
{
    /**
     * Créer ou mettre à jour la photo de profil d'un user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'photo'   => ['required', 'image', 'max:4096'], // 4 Mo
        ]);

        $userId = (int) $validated['user_id'];

        // Supprimer l'ancienne photo si elle existe
        $existing = UserProfilePicture::where('user_id', $userId)->first();
        if ($existing && $existing->photo_url && Storage::disk('public')->exists($existing->photo_url)) {
            Storage::disk('public')->delete($existing->photo_url);
        }

        // Stocker la nouvelle photo
        $path = $request->file('photo')->store('profile_pictures', 'public');

        $picture = UserProfilePicture::updateOrCreate(
            ['user_id' => $userId],
            ['photo_url' => $path]
        );

        return response()->json([
            'data' => [
                'user_id'   => $picture->user_id,
                'photo_url' => Storage::disk('public')->url($picture->photo_url),
            ],
        ], 201);
    }

    public function show(int $userId): JsonResponse
    {
        $picture = UserProfilePicture::where('user_id', $userId)->first();

        if (!$picture) {
            return response()->json([
                'data' => [
                    'user_id'   => $userId,
                    'photo_url' => null,
                ],
            ]);
        }

        return response()->json([
            'data' => [
                'user_id'   => $picture->user_id,
                'photo_url' => Storage::disk('public')->url($picture->photo_url),
            ],
        ]);
    }

    /**
     * Supprimer la photo de profil d'un user.
     */
    public function destroy(int $userId): JsonResponse
    {
        $picture = UserProfilePicture::where('user_id', $userId)->first();

        if (!$picture) {
            return response()->json([
                'message' => 'No profile picture to delete.',
            ], 200);
        }

        if ($picture->photo_url && Storage::disk('public')->exists($picture->photo_url)) {
            Storage::disk('public')->delete($picture->photo_url);
        }

        $picture->delete();

        return response()->json([
            'message' => 'Profile picture deleted.',
        ]);
    }
}
