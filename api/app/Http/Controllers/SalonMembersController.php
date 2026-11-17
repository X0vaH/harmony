<?php

namespace App\Http\Controllers;

use App\Http\Resources\Salon_membersCollection;
use App\Http\Resources\Salon_membersResource;
use App\Http\Resources\SalonResource;
use App\Models\Salon;
use App\Models\salon_members;
use Illuminate\Http\Request;
use App\Models\User;
class SalonMembersController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index() : Salon_membersCollection
    {
        $salon_members = salon_members::all();
        return new Salon_membersCollection($salon_members);
    }

    /**
     * Show the form for creating a new resource.
     * n'est pas utilisé dans une API car on n'a pas de vue à afficher
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
        //TODO: ajouter une validation pour s'assurer que les user et salon existent
        $salon_members = Salon_members::create([
            'user_id' => $request->user_id,
            'salon_id' => $request->salon_id,
        ]);
        return new SalonResource($salon_members);
    }

    /**
     * Display the specified resource.
     */
    public function show(salon_members $salon_members)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(salon_members $salon_members)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, salon_members $salon_members)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(salon_members $salon_members) : Salon_membersResource
    {
        $salon_members->delete();
        return new Salon_membersResource($salon_members);
    }

    /**
     * montre tout les membres d'un salon
     * @param $salonId
     * @return Salon_membersCollection
     */
    public function members($salonId) : Salon_membersCollection
    {
        $members = salon_members::where('salon_id', $salonId)->get();
        $userIds = $members->pluck('user_id')->all();
        $users = User::whereIn('id', $userIds)->get();
        return new Salon_membersCollection($users);
    }

    /**
     * montre tout les salons ou un user fait partis
     * @param $userId - id de l'utilisateur
     * @return Salon_membersCollection
     */
    public function salons_user($userId) : Salon_membersCollection
    {
        $salons_user = salon_members::where('user_id', $userId)->get();
        $salons = $salons_user->pluck('salon_id')->all();
        $salons = Salon::whereIn('id', $salons)->get();
        return new Salon_membersCollection($salons);
    }

    /**
     * get les personnes qui ne sont pas membres d'un salon pour donner la possibilite de les ajouter
     * @param $salonId - id du salon
     * @return Salon_membersCollection
     */
    public function getNotMembers($salonId) : Salon_membersCollection
    {
        $members = salon_members::where('salon_id', $salonId)->get();
        $memberIds = $members->pluck('user_id')->all();
        $notMembers = User::whereNotIn('id', $memberIds)->get();
        return new Salon_membersCollection($notMembers);
    }

    /**
     * montre tout les salons public dont un certain user ne fait pas partis
     * @param $userId - id de l'utilisateur
     * @return Salon_membersCollection
     */
    public function getSalonsPublicUserNotMember($userId) : Salon_membersCollection
    {
        $members = salon_members::where('user_id', $userId)->get();
        $memberIds = $members->pluck('salon_id')->all();
        $notMembers = Salon::whereNotIn('id', $memberIds)->where('is_private', false)->get();
        return new Salon_membersCollection($notMembers);
    }

    public function removeMember($salonId, $userId)
    {
        $salonMember = salon_members::where('salon_id', $salonId)
            ->where('user_id', $userId)
            ->first();

        if ($salonMember) {
            $salonMember->delete();
            return response()->json(['message' => 'Member removed from salon successfully.'], 200);
        } else {
            return response()->json(['message' => 'Member not found in the specified salon.'], 404);
        }
    }

}
