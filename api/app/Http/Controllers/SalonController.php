<?php

namespace App\Http\Controllers;

use App\Http\Resources\SalonCollection;
use App\Http\Resources\SalonResource;
use App\Models\Salon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;


class SalonController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index() : SalonCollection
    {
        $salons = Salon::all();
        return new SalonCollection($salons);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request) : SalonResource
    {
        $salon = Salon::create([
            'name' => $request->name,
            'is_private' => $request->is_private
        ]);
        return new SalonResource($salon);
    }

    /**
     * Display the specified resource.
     */
    public function show(Salon $salon) : SalonResource
    {
        return new SalonResource($salon);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Salon $salon)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $salon)
    {
        try {
            $validated = $request->validate([
                'is_private' => 'required|boolean',
            ]);

            $salon = Salon::find($salon);

            if (!$salon) {
                return response()->json(['error' => 'Salon not found'], 404);
            }

            $salon->is_private = $validated['is_private'];
            $salon->save();

            return response()->json(['message' => 'Salon updated successfully', 'salon' => $salon]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Salon $salon) : SalonResource
    {
        $salon->delete();
        return new SalonResource($salon);
    }

    /**
     * récupérer TOUS les salons publics
     */
    public function getSalonsPublic() : SalonCollection
    {
        $salonsPublic = Salon::where('is_private', false)->get();
        return new SalonCollection($salonsPublic);

    }

    /**
     * récupérer dont un certain unser fait partis
     */
    public function getSalonPriveParticipent($userId)
    {
        // récupérer les salons privés dont l'utilisateur fait partie
        $salonPrive = Salon::where('is_private', true)
            ->whereHas('members', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            ->get();

        return new SalonCollection($salonPrive);
    }

    /**
     * test avec redis
     */
    public function testRedis()
    {

        $salon = Salon::first();
        if (!$salon) {
            return response()->json(['error' => 'Aucun salon trouvé'], 404);
        }



        // Stocker le salon dans Redis
        Redis::set('salon:test', $salon->toJson());

        // Lire le salon depuis Redis
        $cachedSalon = json_decode(Redis::get('salon:test'), true);

        return response()->json(['cached_salon' => $cachedSalon]);
    }
}
