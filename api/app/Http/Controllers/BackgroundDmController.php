<?php

namespace App\Http\Controllers;

use App\Http\Resources\BackgroundDmResource;
use App\Models\BackgroundDm;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BackgroundDmController extends Controller
{
    /**
     * Créer ou mettre à jour la couleur d'un DM.
     * POST /api/backgroundDm
     */
    public function store(Request $request): BackgroundDmResource
    {
        $validated = $request->validate([
            'dm_id'   => ['required', 'integer'],
            'couleur' => ['required', 'string'], // ex: "#ff00ff"
        ]);

        // dm_id normalisé
        $dmId = (int) $validated['dm_id'];
        $couleur = $validated['couleur'];

        $background = BackgroundDm::updateOrCreate(
            ['dm_id' => $dmId],
            ['couleur' => $couleur]
        );

        return new BackgroundDmResource($background);
    }

    /**
     * GET /api/backgroundDm/{dmId}
     * dmId = ID du DM (colonne dm_id)
     */
    public function show(int $dmId): JsonResponse|BackgroundDmResource
    {
        $background = BackgroundDm::where('dm_id', $dmId)->first();

        if (! $background) {
            return response()->json([
                'data' => [
                    'dm_id'   => $dmId,
                    'couleur' => null,
                ],
            ]);
        }

        return new BackgroundDmResource($background);
    }
}
