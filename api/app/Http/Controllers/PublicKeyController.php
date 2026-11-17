<?php

namespace App\Http\Controllers;

use App\Http\Resources\PublicKeyResource;
use App\Models\PublicKey;
use Illuminate\Http\Request;


class PublicKeyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {

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
    public function store(Request $request): PublicKeyResource
    {
        $publicKey = PublicKey::create([
            'public_key' => $request->public_key,
            'user_id' => $request->user_id,
        ]);
        return new PublicKeyResource($publicKey);
    }

    /**
     * Display the specified resource.
     */
    public function show($user_id): PublicKeyResource
    {
        $publicKey = PublicKey::where('user_id', $user_id)->firstOrFail();
        return new PublicKeyResource($publicKey);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(PublicKey $publicKey)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $userId): PublicKeyResource
    {
        $publicKey = PublicKey::where('user_id', $userId)->firstOrFail();
        $publicKey->update([
            'public_key' => $request->public_key,
        ]);
        return new PublicKeyResource($publicKey);
    }
    /**
     * Remove the specified resource from storage.
     */
    public function destroy($userId): PublicKeyResource
    {
        $publicKey = PublicKey::where('user_id', $userId)->firstOrFail();
        $publicKey->delete();
        return new PublicKeyResource($publicKey);
    }
}
